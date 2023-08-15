import products from '../shopify-product-content';
import ProductsList from '../components/ProductsList';
const ProductsListPage =  () => {

    return (
        <>
            <h1>Products</h1>
            <ProductsList products={products} />
        </>
    );
}

export default ProductsListPage;