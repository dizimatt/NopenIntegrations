import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProductNotFoundPage from "./ProductNotFoundPage";
import { generate} from "hmac-auth-express";


const ProductPage =  () => {
    
    const [productInfo, setProductInfo] = useState ({ status: "inactive" });
    const { productId } = useParams();

    // construct the HMAC header so t he api server authorises it...
    const DateNow = Date.now();
    const time = DateNow.toString();
    const digest = generate(process.env.REACT_APP_SHOPIFY_ACCESS_TOKEN, "sha256", time, "GET", `/api/product/${productId}`, {}).digest("hex");

    const hmac = `HMAC ${time}:${digest}`;

    useEffect(() => {
        const loadProductInfo= async () => {
            const config = {
                headers: {
                    "Authorization": hmac,
                    "Content-Type": "application/json"
                }
            }
            const response = await axios.get(`/api/product/${productId}`,config);
            const newProductInfo = response.data.product;
            setProductInfo(newProductInfo);
        };
        loadProductInfo();
    },[]);

    const product=productInfo;

    if  (!product){
        return <ProductNotFoundPage /> ;
    }
    return (
        //{{ __html: sanitize(product.body_html) }}
        <>
        <h1>{product.title}</h1>
        <p>This product status is: {productInfo.status}</p>
        {product.body_html
        ? <div dangerouslySetInnerHTML={{ __html: product.body_html }}/> 
        : 'description hasn\'t been populated, you may want to update this information!'}
        </>
    );
}

export default ProductPage;