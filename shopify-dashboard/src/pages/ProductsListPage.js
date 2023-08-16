import axios from "axios";
//import products from '../shopify-product-content';
import { useState, useEffect } from "react";
import ProductsList from '../components/ProductsList';

const ProductsListPage = () => {
    const [productsList, setProductsList] = useState ([]);

//    const response = await axios.get('http://localhost:8000/api/products');
//    const data = response.data;
    useEffect(() => {
        const loadProductsList= async () => {
            const response = await axios.get('/api/products');
            const newProductsList = response.data.products;
            setProductsList(newProductsList);
        };
        loadProductsList();
    },[]);

    return (
        <>
            <h1>Products</h1>
            <ProductsList products={productsList} />
        </>
    );
}

export default ProductsListPage;