import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProductNotFoundPage from "./ProductNotFoundPage";
import { HMAC, AuthError, generate} from "hmac-auth-express";


const ProductPage =  () => {
    const [productInfo, setProductInfo] = useState ({ status: "inactive" });
    const { productId } = useParams();

    // construct the HMAC header so t he api server authorises it...
    const DateNow = Date.now();
    const time = DateNow.toString();
    const digest = generate("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", "sha256", time, "GET", `/api/product/${productId}`, {}).digest("hex");

    const hmac = `HMAC ${time}:${digest}`;
    console.log(`hmac: ${hmac}\n datetimestamp: ${time}`);


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
            console.log("reloaded  product");
        };
        loadProductInfo();
    },[productId]);

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