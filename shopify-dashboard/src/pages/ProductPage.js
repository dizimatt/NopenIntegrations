import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ProductNotFoundPage from "./ProductNotFoundPage";

const ProductPage =  () => {
    const [productInfo, setProductInfo] = useState ({ status: "inactive" });
    const { productId } = useParams();

    useEffect(() => {
        const loadProductInfo= async () => {
            const response = await axios.get(`/api/product/${productId}`);
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