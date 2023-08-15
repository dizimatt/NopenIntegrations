import { Link } from 'react-router-dom';

const ProductsList = ({ products }) => {
    return (
        <>
        {products.map(product => (
            <Link key={product.id} className='article-list-item' to={`/product/${product.id}`}>
                <h3>{product.title}</h3>
                <p>
                    {product.body_html
                        ?`${product.body_html.substring(0,150)} ...`
                        :'No description body found, it may be wise to update this information!'
                    }
                </p>
            </Link>
        ))} 
        </>
    );
}

export default ProductsList;