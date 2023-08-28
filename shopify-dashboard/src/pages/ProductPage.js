import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProductNotFoundPage from "./ProductNotFoundPage";
import { generate} from "hmac-auth-express";
import {Link} from 'react-router-dom';

const ProductPage = () => {
    
    const [productInfo, setProductInfo] = useState ({});
    const { productId } = useParams();
    var [idToFetch, setIdToFetch] = useState (productId);

    // construct the HMAC header so t he api server authorises it...
    const DateNow = Date.now();
    const time = DateNow.toString();
    const digest = generate("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", "sha256", time, "GET", `/api/product/${productId}`, {}).digest("hex");

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
            const response = await axios.get(`/api/product/${idToFetch}`,config);
            setProductInfo(response.data.product);
            console.log(`finished... set status to ${productInfo.status}`)
        };
        loadProductInfo();
    },[idToFetch]);

    if  (!productInfo){
        return <ProductNotFoundPage /> ;
    }

    function changeStatus(e, newStatus) {
        console.log(`about to trigger to set the status to : ${newStatus}`);
        productInfo.status = newStatus;
        setIdToFetch(7255537811640);
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