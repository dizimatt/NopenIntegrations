import '@shopify/shopify-api/adapters/node';
import shopify, {shopifyApi, LATEST_API_VERSION, ApiVersion, DataType} from '@shopify/shopify-api';
import express, { json, query } from 'express';
import {MongoClient} from 'mongodb';
import {HMAC, AuthError} from "hmac-auth-express";
import dotenv from 'dotenv';
import {apiProducts,apiProduct} from './routes/main.js';
import {apiShopifyProducts, apiShopifyProductsIndex, apiShopifyProductsImport, apiShopifyProduct} from './routes/shopify.js';

dotenv.config();


var shopifyApiClient;
const dbClient = new MongoClient(process.env.MONGO_CLIENT_URL);

try{
  await dbClient.connect();
} catch (err) {
  console.log("failed to connect to mongodb!, %o", err);
}

const fetchShopifySession = async (shopURL) => {
//  const client = new MongoClient(process.env.MONGO_CLIENT_URL);
  try{
//    await client.connect();

    const db = dbClient.db('shopify');

    var param_SHOPIFY_SESSSION_SHOP = ""
    if (shopURL){
      param_SHOPIFY_SESSSION_SHOP = shopURL;
    }
    const ShopifySession = await db.collection('shopifySession').findOne({SHOPIFY_SESSION_SHOP: param_SHOPIFY_SESSSION_SHOP});
  //  const ShopifySession = await db.collection('shopifySession').findOne({APP_NAME: process.env.APP_NAME});

    if (ShopifySession){
      return {
        id: ShopifySession.SHOPIFY_SESSION_ID,
        shop: ShopifySession.SHOPIFY_SESSION_SHOP,
        state: ShopifySession.SHOPIFY_SESSION_STATE,
        isOnline: false,
        accessToken:  ShopifySession.SHOPIFY_ACCESS_TOKEN,
        scope: ShopifySession.SHOPIFY_SESSION_SCOPE
      };
    } else {
      return {};
    }
  } catch (err) {
    console.log("failed to query session from mongodb!");
    return {};
  }

  console.log(`session: %o`,session);
  return true;
};

const fetchShopifyAPICreds = async (shopURL) => {
//  const client = new MongoClient(process.env.MONGO_CLIENT_URL);
  try{
//    await client.connect();
    const db = dbClient.db('shopify');

    //first fetch the shopify app name from the session table/collection (if not found, it's not installed - take it from the env vars)
    const ShopifySession = await db.collection('shopifySession').findOne({SHOPIFY_SESSION_SHOP: shopURL});
    var app_name = "";
    if (ShopifySession){
      app_name = ShopifySession.APP_NAME;
    } else {
      app_name = process.env.APP_NAME;
    }
    const ShopifyApp = await db.collection('shopifyApp').findOne({APP_NAME: app_name});

    if (ShopifyApp){
      return {
        apiKey: ShopifyApp.SHOPIFY_API_KEY,
        apiSecretKey: ShopifyApp.SHOPIFY_API_SECRET_KEY,
        scopes: ShopifyApp.SHOPIFY_SCOPES.split(", "),
        hostName: ShopifyApp.SHOPIFY_HOSTNAME  
      };
    } else {
      return {};
    }
  } catch (err) {
    console.log("failed to query shop-session from mongodb! err: %o",err);
    return {};
  }
};


const initShopifyApiClient = async (shopURL) => {
  const _shopifyAPICreds = await fetchShopifyAPICreds(shopURL);
  try{
    shopifyApiClient = shopifyApi(_shopifyAPICreds);
  }catch(err){
    console.log(`errored in initialising the shopifyapi: ${err.message} `);
  };


  if (shopURL !== undefined){
    return await fetchShopifySession(shopURL);
  } else {
    return {};
  }
}


const app = express();

function rawBody(req, res, next) {
  if (req.is('text/*') == "text/plain"){
    req.setEncoding('utf8');
    req.rawBody = '';
    req.on('data', function(chunk) {
      req.rawBody += chunk;
    });
    req.on('end', function(){
      next();
    });
  } else {
    next();
  }
}
app.use(rawBody);

  //app.use(express.bodyParser());
//  app.use(express.methodOverride());


app.use(express.json());

//app.use("/api/", HMAC(session.accessToken));

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
  console.log("auth...");
    await initShopifyApiClient();
    // The library will automatically redirect the user
    await shopifyApiClient.auth.begin({
      shop: shopifyApiClient.utils.sanitizeShop(req.query.shop, true),
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
});
app.get('/auth/callback', async (req, res) => {
    await initShopifyApiClient();

    // The library will automatically set the appropriate HTTP headers
    const callback = await shopifyApiClient.auth.callback({
        rawRequest: req,
        rawResponse: res,
    });


    console.log("sending authcallback: %o",callback);
    res.send({
        authCallback: callback
    });


//    const client = new MongoClient(process.env.MONGO_CLIENT_URL);
    try{
//      await client.connect();
    
      const db = dbClient.db('shopify');

      const shopifySessionCursor = db.collection('shopifySession').insertOne(
        {
          APP_NAME: process.env.APP_NAME,
          SHOPIFY_SESSION_ID: callback.session.id,
          SHOPIFY_SESSION_SHOP: callback.session.shop,
          SHOPIFY_SESSION_STATE: callback.session.state,
          SHOPIFY_ACCESS_TOKEN: callback.session.accessToken,
          SHOPIFY_SESSION_SCOPE: callback.session.scope
        }
      )
      .catch((err) => {
        res.send({mongoerror: err});
      });
    } catch (err) {
      console.log("auth:callback: failed to insert session into mongodb! err: %o",err);
      res.send({mongoerror: err});
    }  


    // You can now use callback.session to make API requests

//    res.redirect('/my-apps-entry-page');
});
// end of shopify installations functions

app.get('/api/products', async (req, res) => {
  apiProducts(req,res,dbClient);
});

app.get('/api/product/:productId', async (req, res) => {
  apiProduct(req,res,dbClient);
});

app.get('/api/shopify/product/:productId', async (req, res) => {
  apiShopifyProduct(req, res, dbClient);
});

app.get('/api/shopify/gql-products', async (req, res) => {
  const shopURL = req.query.shop;
  // get a all products via GET RESTful API call
  const shopify_session = await initShopifyApiClient(shopURL);

  try{
    const client = new shopifyApiClient.clients.Rest({
      session: shopify_session,
      apiVersion: ApiVersion.January23,
    });
    const products = await client.post({
      path: `graphql.json`,
      data: `query {
          products(first: 10, reverse: true) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
        }`
      ,
      type: DataType.GraphQL
    }).catch((err) => {
      console.log(`error  in calling the shopify client api: ${err.message}`);
      res.send({error: err.message})
    });

    if (products !== undefined){
      if (products.body.errors !== undefined){
        res.send({error: products.body.errors});
      } else {
        res.send({products: products.body.data.products});
      }
    }
  }catch(err){
    console.log(`error  in calling the shopify client api: ${err.message}`);
    res.send({error: err.message});
  }
});

app.get('/api/shopify/products', async (req, res) => {
    apiShopifyProducts(req,res,dbClient);
});

app.get('/api/shopify/products/index', async (req, res) => {
  apiShopifyProductsIndex(req,res,dbClient);
});

app.post('/api/shopify/products/import', async (req, res) => {
  apiShopifyProductsImport(req,res,dbClient);
});

app.get('/api/shopify/webhook/subscribe', async (req, res) => {
//  1150082351288
  const shopURL = req.query.shop;
  // get a all products via GET RESTful API call
  const shopify_session = await initShopifyApiClient(shopURL);

  // Session is built by the OAuth process
  const client = new shopifyApiClient.clients.Rest({
    session: shopify_session,
    apiVersion: ApiVersion.January23,
  });
  const productsResults = await client.post({
    path: `webhooks`,
    data: {
      "webhook":{
        "address":`https://${shopifyApiClient.config.hostName}/api/shopify/webhook-triggers/products/update`,
        "topic":"products/update",
        "format":"json"
      }
    },
    type: DataType.JSON
  }).catch((err) => {
    console.log("webhook subscribe failed: %o" + err.message);
  });

  res.send({webhook_subscribe_results:productsResults});
});

app.get('/api/shopify/webhook/unsubscribe', async (req, res) => {
  // 1150082220216
  const shopURL = req.query.shop;
  const webhook_id = req.query.id;
  // get a all products via GET RESTful API call
  const shopify_session = await initShopifyApiClient(shopURL);

  // Session is built by the OAuth process
  const client = new shopifyApiClient.clients.Rest({
    session: shopify_session,
    apiVersion: ApiVersion.January23,
  });
  const unsubscribeResults = await client.delete({
    path: `webhooks/${webhook_id}`,
    type: DataType.JSON
  }).catch((err) => {
    console.log("webhook unsubscribe failed: %o" + err.message);
  });

  res.send({webhook_unsubscribe_results:unsubscribeResults});
});
app.get('/api/shopify/webhooks', async (req, res) => {
  // 1150082220216
  const shopURL = req.query.shop;
  const webhook_id = req.query.id;
  console.log("will remove webhook id: %o",webhook_id);
  // get a all products via GET RESTful API call
  const shopify_session = await initShopifyApiClient(shopURL);

  // Session is built by the OAuth process
  const client = new shopifyApiClient.clients.Rest({
    session: shopify_session,
    apiVersion: ApiVersion.January23,
  });
  const webhookList = await client.get({
    path: `webhooks`,
    type: DataType.JSON
  }).catch((err) => {
    console.log("webhook list failed: %o" + err.message);
  });

  res.send({webhooks:webhookList});
});

app.post('/api/shopify/webhook-triggers/products/update', async (req, res) => {
  const body = req.body;

//  const shopURL = req.query.shop;
  // get a all products via GET RESTful API call
//  const shopify_session = await initShopifyApiClient(shopURL);
  console.log("trigger: products/update - req: %o", req.body);
  res.send({
    status:"product updated!",
    request: req.body
  });
});

app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});

