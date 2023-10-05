import '@shopify/shopify-api/adapters/node';
import express, { json, query } from 'express';
import {MongoClient} from 'mongodb';
import {HMAC, AuthError} from "hmac-auth-express";
import dotenv from 'dotenv';
import {apiProducts,apiProduct} from './routes/main.js';
import {apiShopifyProducts, apiShopifyProductsIndex, apiShopifyProductsImport, apiShopifyProduct,  
  shopifyAuth,shopifyAuthCallback, 
  apiShopifyWebhookUnsubscribe, apiShopifyWebhooks, apiShopifyWebhookTriggersProductsUpdate, apiShopifyWebhookSubscribeProductsUpdate,
  apiShopifyWebhookSubscribeCartsUpdate, apiShopifyWebhookTriggersCartsUpdate,apiShopifyWebhookSubscribeOrdersCreate, apiShopifyWebhookTriggersOrdersCreate,
  apiShopifyGqlProducts, apiShopifyGqlCartTransforms} 
  from './routes/shopify.js';

dotenv.config();
const dbClient = new MongoClient(process.env.MONGO_CLIENT_URL);

try{
  await dbClient.connect();
} catch (err) {
  console.log("failed to connect to mongodb!, %o", err);
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
  shopifyAuth(req,res,dbClient);
});

app.get('/auth/callback', async (req, res) => {
  shopifyAuthCallback(req,res,dbClient);
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

app.get('/api/shopify/gql/products', async (req, res) => {
  apiShopifyGqlProducts(req, res, dbClient);
});
app.get('/api/shopify/gql/carttransforms', async (req, res) => {
  apiShopifyGqlCartTransforms(req, res, dbClient);
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

app.get('/api/shopify/webhook/subscribe/products/update', async (req, res) => {
  apiShopifyWebhookSubscribeProductsUpdate(req,res,dbClient);
//  1150082351288
});
app.post('/api/shopify/webhook-triggers/products/update', async (req, res) => {
  apiShopifyWebhookTriggersProductsUpdate(req, res,dbClient);
});
app.get('/api/shopify/webhook/subscribe/carts/update', async (req, res) => {
  apiShopifyWebhookSubscribeCartsUpdate(req,res,dbClient);
//  1150082351288
});
app.post('/api/shopify/webhook-triggers/orders/create', async (req, res) => {
  apiShopifyWebhookTriggersCartsUpdate(req, res,dbClient);
});

app.get('/api/shopify/webhook/unsubscribe', async (req, res) => {
  apiShopifyWebhookUnsubscribe(req,res,dbClient);
  /*
  // 1150082220216
  */
});
app.get('/api/shopify/webhooks', async (req, res) => {
  apiShopifyWebhooks(req,res,dbClient);
  // 1150082220216
});

app.get('/api/shopify/webhook/subscribe/orders/create', async (req, res) => {
  apiShopifyWebhookSubscribeOrdersCreate(req,res,dbClient);
});
app.get('/api/shopify/webhook-triggers/orders/create', async (req, res) => {
  apiShopifyWebhookTriggersOrdersCreate(req,res,dbClient);
});

app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});

