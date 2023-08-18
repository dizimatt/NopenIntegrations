import '@shopify/shopify-api/adapters/node';
import {shopifyApi, LATEST_API_VERSION, Session} from '@shopify/shopify-api';
import express, { json } from 'express';
import ProductsList from './components/ProductsList.js';
import Product from './components/Product.js';

const session = Session;
const shopify = shopifyApi({
    apiKey: '0528d6d32590c36a23635ebdf149df6d',
    apiSecretKey: 'f6fb72c025be48548e0ce4f9d03caf29',
    scopes: ['read_products'],
    hostName: 'b2bd-116-89-24-12.ngrok-free.app',
});


const app = express();
app.use(express.json());

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
/*
app.post('/hello',(req, res) => {
    res.send({
       hellomessage: req.body.name
    });
    //`Hello ${req.body.name}! (from post endpoint)`);
});

app.get('/hello/:name', (req, res) => {
    const {name} = req.params;
    res.send(`hello ${name}!!`);
});
*/

app.get('/api/product/:productId',(req, res) => {
    const { productId } = req.params;
    const product= Product(productId);
    
    if (product) {
        res.send({product: product});
    } else {
        res.send({
            error: "product not found"
        });
    }
//    res.send(products);
});
app.get('/api/products',(req, res) => {
    res.send( ProductsList() );
});

app.get('/api/test-shopify',(req, res) => {
    /*
    const shopify = new Shopify({
        shopName: 'openresourcing',
        apiKey: '22d155352683f672fae593e2b05f3437',
        password: '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',
        accessToken: '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' 
      });

    shopify.product
        .get('6086253772984')
        .then((product) => console.log(product))
        .catch((err) => console.error(err));
    */
    res.send( {result: "successfull"} );
});

app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});