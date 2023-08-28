import axios from "axios";

//import products from '../shopify-product-content';
import { useState, useEffect } from "react";
import ProductsList from '../components/ProductsList';
import { generate} from "hmac-auth-express";
import ProductsListPageNavBar from "../ProductsListPageNavBar";


const ProductsListPage = () => {
    const [productsList, setProductsList] = useState ([]);

    const DateNow = Date.now();
    const time = DateNow.toString();
    const digest = generate("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", "sha256", time, "GET", `/api/products`, {}).digest("hex");

    const hmac = `HMAC ${time}:${digest}`;

    useEffect(() => {
        const config = {
            headers: {
                "Authorization": hmac,
                "Content-Type": "application/json"
            }
        }
        const loadProductsList= async () => {
            const response = await axios.get('/api/products',config);
            const newProductsList = response.data.products;
            setProductsList(newProductsList);
        };
        loadProductsList();
    },[]);

    return (
        <>
            <h1>Products</h1>
            <ProductsListPageNavBar />
            <ProductsList products={productsList} />
        </>
    );
}

export default ProductsListPage;