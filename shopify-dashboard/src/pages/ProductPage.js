import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import products from '../shopify-product-content';
import ProductNotFoundPage from "./ProductNotFoundPage";

const ProductPage =  () => {
    const [productInfo, setProductInfo] = useState ({ status: "inactive" });
    const { productId } = useParams();


    useEffect(() => {
        const loadProductInfo= async () => {
//            console.log("loading product");
            const response = await axios.get(`/api/product/${productId}`);
            const newProductInfo = response.data.product;
//            console.log(newProductInfo);
            setProductInfo(newProductInfo);    
        };
        loadProductInfo();
    },[]);

    console.log(productInfo);
    const product=productInfo;
    //products.find(product => product.id.toString() === productId);

    if  (!product){
        return <ProductNotFoundPage /> ;
    }

    return (
        //{{ __html: sanitize(product.body_html) }}
        <>
        <script type="text/javascript">alert("testing");</script>
        <h1>{product.title}</h1>
        <p>This product status is: {productInfo.status}</p>
        {product.body_html
        ? <div dangerouslySetInnerHTML={{ __html: product.body_html }}/> 
        : 'description hasn\'t been populated, you may want to update this information!'}
        </>
    );
}

export default ProductPage;