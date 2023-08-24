import { Link } from 'react-router-dom';

const ProductsListPageNavBar=() => {
    return (
        <span>
            <h2>hew navbar</h2>
            <ul>
                <li>
                    <Link to="/Products/Reindex">Reindex Products</Link>
                </li>
            </ul>
        </span>
    );
}

export default ProductsListPageNavBar;