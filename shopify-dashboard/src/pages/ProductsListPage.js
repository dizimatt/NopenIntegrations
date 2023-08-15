import axios from "axios";
import products from '../shopify-product-content';
import ProductsList from '../components/ProductsList';
const ProductsListPage = () => {
//    const response = await axios.get('http://localhost:8000/api/products');
//    const data = response.data;
    return (
        <>
            <h1>Products</h1>
            <ProductsList products={products} />
        </>
    );
}

export default ProductsListPage;