import products from '../shopify-product-content.js';

const Product = (productId) => {
    const product=products.find(product => product.id.toString() === productId);
    return (product);
}

export default Product;