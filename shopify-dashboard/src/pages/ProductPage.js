import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProductNotFoundPage from "./ProductNotFoundPage";
import { generate} from "hmac-auth-express";
import {Link} from 'react-router-dom';

const ProductPage = () => {
    
    const [productInfo, setProductInfo] = useState ({});
    var { productId } = useParams();

    // construct the HMAC header so t he api server authorises it...
    const DateNow = Date.now();
    const time = DateNow.toString();
    const digest = generate(process.env.REACT_APP_SHOPIFY_ACCESS_TOKEN, "sha256", time, "GET", `/api/product/${productId}`, {}).digest("hex");

    const hmac = `HMAC ${time}:${digest}`;

    useEffect(() => {
        console.log("loading");
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
            console.log(`finished... set status to ${productInfo.status}`)
        };
        loadProductInfo();
    },[productInfo.status]);

    if  (!productInfo){
        return <ProductNotFoundPage /> ;
    }

    function changeStatus(e, newStatus) {
        console.log(`about to trigger to set the status to : ${newStatus}`);
        productInfo.status = newStatus;
    }

    return (
        //{{ __html: sanitize(product.body_html) }}
        <>
        <h1>{productInfo.title}</h1>
        <p>This product status is: <Link to = "#" onClick= {(e) => changeStatus(e,'draft') }>{productInfo.status}</Link></p>
        {productInfo.body_html
        ? <div dangerouslySetInnerHTML={{ __html: productInfo.body_html }}/> 
        : 'description hasn\'t been populated, you may want to update this information!'}
        </>
    );
}

export default ProductPage;