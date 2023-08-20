import '@shopify/shopify-api/adapters/node';
import {shopifyApi, LATEST_API_VERSION, ApiVersion} from '@shopify/shopify-api';
import express from 'express';
import {MongoClient} from 'mongodb';
import {HMAC, AuthError} from "hmac-auth-express";

const AccessToken = "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";
const session = {
    "id": "offline_openresourcing.myshopify.com",
    "shop": "openresourcing.myshopify.com",
    "state": "192801790526280",
    "isOnline": false,
    "accessToken": "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",
    "scope": "read_products"
};

const shopify = shopifyApi({
    apiKey: '0528d6d32590c36a23635ebdf149df6d',
    apiSecretKey: 'f6fb72c025be48548e0ce4f9d03caf29',
    scopes: ['read_products'],
    hostName: 'b2bd-116-89-24-12.ngrok-free.app',
});

const app = express();
app.use(express.json());

app.use("/api/product", HMAC("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"));

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

app.get('/api/product/:productId', async (req, res) => {
    const { productId } = req.params;
    console.log(`Authorization:${req.get('Authorization')}`);

    const client = new MongoClient('mongodb://openresourcing:D0z1n2ss@mongo:27017/shopify');
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
    const { productId } = req.params;

    const sessionId = "offline_openresourcing.myshopify.com";
      
      // get a single product via its product id
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
});

app.get('/api/products', async (req, res) => {

    const client = new MongoClient('mongodb://openresourcing:D0z1n2ss@mongo:27017/shopify');
    await client.connect();

    const db = client.db('shopify');

    const productsCursor = await db.collection('products').find({});
    const products = [];
    for await (const product of productsCursor){
        products.push(product);
    }

    res.json({products});
});

app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});