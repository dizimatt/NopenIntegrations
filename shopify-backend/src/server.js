import '@shopify/shopify-api/adapters/node';
import {shopifyApi, LATEST_API_VERSION, ApiVersion} from '@shopify/shopify-api';
import express, { json } from 'express';
import {MongoClient} from 'mongodb';
import {HMAC, AuthError} from "hmac-auth-express";
import dotenv from 'dotenv';
dotenv.config();

const session = {};
const shopifyAPICreds = {};

const fetchShopifySession = async () => {
  const client = new MongoClient(process.env.MONGO_CLIENT_URL);
  await client.connect();

  const db = client.db('shopify');

  console.log(`app_name::  ${process.env.APP_NAME}`);
  const ShopifySession = await db.collection('shopifySession').findOne({APP_NAME: process.env.APP_NAME});

  if (ShopifySession){
    session.id  = ShopifySession.SHOPIFY_SESSION_ID; 
    session.shop = ShopifySession.SHOPIFY_SESSION_SHOP;
    session.state = ShopifySession.SHOPIFY_SESSION_STATE;
    session.isOnline = false;
    session.accessToken =  ShopifySession.SHOPIFY_ACCESS_TOKEN;
    session.scope = ShopifySession.SHOPIFY_SESSION_SCOPE;
  }
  return true;
};

const fetchShopifyAPICreds = async () => {
  const client = new MongoClient(process.env.MONGO_CLIENT_URL);
  await client.connect();

  const db = client.db('shopify');

  const ShopifyApp = await db.collection('shopifyApp').findOne({APP_NAME: process.env.APP_NAME});

  if (ShopifyApp){
    shopifyAPICreds.apiKey = ShopifyApp.SHOPIFY_API_KEY; 
    shopifyAPICreds.apiSecretKey = ShopifyApp.SHOPIFY_API_SECRET_KEY;
    shopifyAPICreds.scopes = ShopifyApp.SHOPIFY_SCOPES.split(", ");
    shopifyAPICreds.hostName = ShopifyApp.SHOPIFY_HOSTNAME;
  }
  return true;
};

await fetchShopifyAPICreds();
await fetchShopifySession();

var shopify;
try{
  shopify = shopifyApi(shopifyAPICreds);
}catch(err){
  console.log(`errored in initialising the shopifyapi: ${err.message} `);
};

const app = express();
app.use(express.json());

// app.use("/api/", HMAC(session.accessToken));

// express' error handler
app.use((error, req, res, next) => {
    // check by error instance
    if (error instanceof AuthError) {
      res.status(401).json({
        error: "Invalid request",
        info: error.message,
      });
    }
  
    // alternative: check by error code
    if (error.code === "ERR_HMAC_AUTH_INVALID") {
      res.status(401).json({
        error: "Invalid request",
        info: error.message,
      });
    }
  });

app.get('/',(req, res) => {
    res.send('<html><body><h1>you\'ve reached the api endpoints - please contact support for api documentation</h1></body></html>');
});

// next two functions are the shopify app installation functions - add these endpoints into the shopify app config BEFORE installing
app.get('/auth', async (req, res) => {
    // The library will automatically redirect the user
    await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(req.query.shop, true),
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
});
app.get('/auth/callback', async (req, res) => {
    // The library will automatically set the appropriate HTTP headers
    const callback = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
    });

    console.log("sending authcallback: %o",callback);
    res.send({
        authCallback: callback
    });
    // You can now use callback.session to make API requests

//    res.redirect('/my-apps-entry-page');
});
// end of shopify installations functions

app.get('/api/products', async (req, res) => {

  const client = new MongoClient(process.env.MONGO_CLIENT_URL);
  await client.connect();

  const db = client.db('shopify');

  const productsCursor = await db.collection('products').find({});
  const products = [];
  for await (const product of productsCursor){
      products.push(product);
  }

  res.json({products});
});

app.get('/api/product/:productId', async (req, res) => {
    const { productId } = req.params;

    const client = new MongoClient(process.env.MONGO_CLIENT_URL);
    await client.connect();

    const db = client.db('shopify');

    const product = await db.collection('products').findOne({id: parseInt(productId)});
    if (product){
        res.json({product});
    } else {
        res.sendStatus(404);
    }
});

app.get('/api/product-from-shopify/:productId', async (req, res) => {

  console.log(`latest session access token: ${session.accessToken}`);

  const { productId } = req.params;

      
      // get a single product via its product id
      try{
        const client = new shopify.clients.Rest({
          session,
          apiVersion: ApiVersion.January23,
        });
        const product = await client.get({
          path: `products/${productId}.json`,
          query: {id:1, title: "title"}
        }).catch((err) => {
          const product = {};
        });

        const newProduct = {product:{}};
        if (product !== undefined){
          newProduct.product = product.body.product;
        }
    //      const product = await shopify.rest.Product.find({session, id: '7504536535062'});
  
        res.send(newProduct);
      }catch(err){
        console.log(`error  in callingthe shopify client api: ${err.message}`);
        res.send({failed:true, error: err.message});
      }
});

app.get('/api/shopify/products/index', async (req, res) => {

  try{
    // get a single product via its product id
    const client = new shopify.clients.Rest({
      session,
      apiVersion: ApiVersion.January23,
    });

    const productsResults = await client.get({
      path: `products`
    }).catch((err) => {
      const productsResults = {};
    });

    const finalProducts = [];
    if (productsResults){
      const mongoClient = new MongoClient(process.env.MONGO_CLIENT_URL);
      await mongoClient.connect();
    
      const db = mongoClient.db('shopify');

      db.collection('products').deleteMany({});

      productsResults.body.products.forEach(product => { 
        finalProducts.push(product);

        //now write the same product back to mogodb
        const productsCursor = db.collection('products').insertOne(product)
        .catch((err) => {
          res.send({mongoerror: err});
        });
    
      });
    }
    res.send(finalProducts);
  } catch(err) {
    console.log(`error  in callingthe shopify client api: ${err.message}`);
    res.send({failed:true, error: err.message});
  }
});

app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});