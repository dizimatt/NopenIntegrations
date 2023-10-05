import shopify, {shopifyApi, LATEST_API_VERSION, ApiVersion, DataType} from '@shopify/shopify-api';
import csvToJson from 'csvtojson';

var shopifyApiClient;
var dbClient;

export async function shopifyAuthCallback(req, res, _dbClient) {
  dbClient = _dbClient;
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
};

export async function shopifyAuth(req, res, _dbClient) {
  dbClient = _dbClient;

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
};

const fetchShopifySession = async (shopURL) => {
    console.log("shopurl: "+ shopURL);
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
      
export async function apiShopifyProducts(req, res, _dbClient) {
    dbClient = _dbClient;

    const shopURL = req.query.shop;
    // get a all products via GET RESTful API call
    const shopify_session = await initShopifyApiClient(shopURL);
    try{
      const client = await new shopifyApiClient.clients.Rest({
        session: shopify_session,
        apiVersion: ApiVersion.January23,
      });
      const products = await client.get({
        path: `products.json`
      }).catch((err) => {
          const products = {};
      });

      const allProducts = {products:[]};
      if (products !== undefined){
        allProducts.products = products.body.products;
      }

      res.send(allProducts);
    }catch(err){
      console.log(`shopify/products: error  in callingthe shopify client api: ${err.message}`);
      
      res.send({failed:true, error: err.message});
    }
}
export async function apiShopifyProductsIndex(req, res, _dbClient) {
    dbClient = _dbClient;
    const shopURL = req.query.shop;
    // get a all products via GET RESTful API call
    const shopify_session = await initShopifyApiClient(shopURL);
  
    try{
      // get a single product via its product id
      const client = new shopifyApiClient.clients.Rest({
        session: shopify_session,
        apiVersion: ApiVersion.January23,
      });
  
  
      const productsResults = await client.get({
        path: `products`
      }).catch((err) => {
        const productsResults = {};
      });
  
      const finalProducts = [];
      if (productsResults){
  //      const mongoClient = new MongoClient(process.env.MONGO_CLIENT_URL);
  //      await mongoClient.connect();
      
        const db = dbClient.db('shopify');
  
        db.collection('products').deleteMany({shopURL: shopURL});
  
        productsResults.body.products.forEach(product => { 
          finalProducts.push(product);
  
          //now write the same product back to mogodb
          Object.assign(product, {shopURL: shopURL});
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
}
export async function apiShopifyProductsImport(req, res, _dbClient) {
    dbClient = _dbClient;
    const shopURL = req.query.shop;
    // get a all products via GET RESTful API call
    const shopify_session = await initShopifyApiClient(shopURL);
    try{
      // get a single product via its product id
      const client = new shopifyApiClient.clients.Rest({
        session: shopify_session,
        apiVersion: ApiVersion.January23,
      });
  
      //  console.log(`json returned: ${jsonString}`);
      // res.send({returned: json});
    
      const body = req.body;
      
  //    console.log("request body: %o",req.body);
  //    console.log(req.is('text/*'));
  //    console.log(req.is('json'));
  //    console.log('RB: ' + req.rawBody);
  //    console.log('B: ' + JSON.stringify(req.body));
  
      if (req.rawBody !== undefined){
  
        const products = await csvToJson().fromString(req.rawBody);
  //      console.log(`products:%o`,products);
  
        products.forEach( async product => {
  //        console.log('will insert product: %o',product);
  
          
          const productsResults = await client.post({
            path: `products`,
            data: {
              product: product
            },
            type: DataType.JSON
          }).catch((err) => {
            console.log("product insert failed:" + err.message + ": \nproduct payload:\n %o",product);
          });
  
          // insert was successful, now need to retreve the product id...
          if (productsResults !== undefined && product.category){
            const newProductId = productsResults.body.product.id;
            
            if (product.category){
    //          console.log(`adding product into collection:${product.category}`);
              const collectionUpdateResults = await client.put({
                path: `custom_collections/${product.category}`,
                data: {
                  custom_collection:{
                    id: product.category,
                    collects: [
                      { 
                        product_id: newProductId,
                        position: 1
                      }
                    ]
                  }
                },
                type: DataType.JSON
              }).catch((err) => {
                console.log("collection update failed:" + err.message + ": \ncollection id: "+product.category+", product id: " +newProductId);
              });
            }
          }
  //        console.log(`generated productId: ${productsResults.body.product.id}`);
          
  
        });
        console.log("completed the product import, please check above for any erros generated");
        res.send(products);
      } else {
        res.send({failed:true, error: "couldn't find the products to insert!"});
      }
    } catch(err) {
      console.log(`error  in calling the shopify client api: ${err.message}`);
      res.send({failed:true, error: err.message});
    }
};
export async function apiShopifyProduct(req, res, _dbClient) {
    dbClient = _dbClient;
    const shopURL = req.query.shop;
    // get a all products via GET RESTful API call
    const shopify_session = await initShopifyApiClient(shopURL);
  
    const { productId } = req.params;
  
        
        // get a single product via its product id
        try{
          const client = new shopifyApiClient.clients.Rest({
            session: shopify_session,
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
};
export async function apiShopifyWebhookSubscribe(req, res, _dbClient) {
  dbClient = _dbClient;
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

};
export async function apiShopifyWebhookUnsubscribe(req, res, _dbClient) {
  dbClient = _dbClient;
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
};
export async function apiShopifyWebhooks(req, res, _dbClient) {
  dbClient = _dbClient;
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

};
export async function apiShopifyWebhookTriggersProductsUpdate(req, res, _dbClient) {
  dbClient = _dbClient;
  const body = req.body;

//  const shopURL = req.query.shop;
  // get a all products via GET RESTful API call
//  const shopify_session = await initShopifyApiClient(shopURL);
  console.log("trigger: products/update - req: %o", req.body);
  res.send({
    status:"product updated!",
    request: req.body
  });
}
export async function apiShopifyGqlProducts(req, res, _dbClient) {
  dbClient = _dbClient;
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

}
export async function apiShopifyWebhookSubscribeCartsUpdate(req, res, _dbClient) {
  dbClient = _dbClient;
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
        "address":`https://${shopifyApiClient.config.hostName}/api/shopify/webhook-triggers/carts/update`,
        "topic":"carts/update",
        "format":"json"
      }
    },
    type: DataType.JSON
  }).catch((err) => {
    console.log("webhook subscribe failed: %o" + err.message);
  });

  res.send({webhook_subscribe_results:productsResults});

};

export async function apiShopifyWebhookTriggersCartsUpdate(req, res, _dbClient) {
  dbClient = _dbClient;
  const body = req.body;

//  const shopURL = req.query.shop;
  // get a all products via GET RESTful API call
//  const shopify_session = await initShopifyApiClient(shopURL);
  console.log("trigger: carts/update - req: %o", req.body);
  res.send({
    status:"cart updated!",
    request: req.body
  });
}
