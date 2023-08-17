import express, { json } from 'express';
import ProductsList from './components/ProductsList.js';
import Product from './components/Product.js';

const app = express();
app.use(express.json());

app.get('/',(req, res) => {
    res.send('<html><body><h1>you\'ve reached the api endpoints - please contact support for api documentation</h1></body></html>');
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

app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});