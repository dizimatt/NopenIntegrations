import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProductNotFoundPage from "./ProductNotFoundPage";
import { generate} from "hmac-auth-express";

const ProductPage = () => {
    
    const [productInfo, setProductInfo] = useState ({});
    console.log(`params: %o`,useParams("productId"));
    const [productId, setIdToFetch] = useState (useParams("productId").productId);

//    const { productId } = useParams();
//    var [idToFetch, setIdToFetch] = useState (productId);

    // construct the HMAC header so t he api server authorises it...
    const DateNow = Date.now();
    const time = DateNow.toString();
    const digest = generate("dummyaccesstoken", "sha256", time, "GET", `/api/product/${productId}`, {}).digest("hex");

    const [hmac, setHmac] = useState (`HMAC ${time}:${digest}`);

    useEffect(() => {
        const loadProductInfo= async () => {
            const config = {
                headers: {
                    "Authorization": hmac,
                    "Content-Type": "application/json"
                }
            }
            const response = await axios.get(`/api/product/${productId}`,config);
            setProductInfo(response.data.product);
        };
        loadProductInfo();
    },[productId, hmac]);

    if  (!productInfo){
        return <ProductNotFoundPage /> ;
    }

/*
    function changeStatus(e, newStatus) {
        console.log(`about to trigger to set the status to : ${newStatus}`);
//        productInfo.status = newStatus;
//        setHmac("testhmac");
    }
*/
/*
<Link to = "#" onClick= {(e) => changeStatus(e,'draft') }></Link>
*/
    return (
        //{{ __html: sanitize(product.body_html) }}
        <>
        <h1>{productInfo.title}</h1>
        <p>This product status is: {productInfo.status}</p>
        {productInfo.body_html
        ? <div dangerouslySetInnerHTML={{ __html: productInfo.body_html }}/> 
        : 'description hasn\'t been populated, you may want to update this information!'}
        </>
    );
}

export default ProductPage;