import { useParams } from "react-router-dom";
import products from '../shopify-product-content';
import ProductNotFoundPage from "./ProductNotFoundPage";
import { sanitize } from 'dompurify';

const ProductPage =  () => {
    const { productId } = useParams();
    const product=products.find(product => product.id.toString() === productId);

    console.log(products);

    if  (!product){
        return <ProductNotFoundPage /> ;
    }

    return (
        //{{ __html: sanitize(product.body_html) }}
        <>
        <script type="text/javascript">alert("testing");</script>
        <h1>{product.title}</h1>
        {product.body_html
        ? <div dangerouslySetInnerHTML={{ __html: product.body_html }}/> 
        : 'description hasn\'t been populated, you may want to update this information!'}
        </>
    );
}

export default ProductPage;