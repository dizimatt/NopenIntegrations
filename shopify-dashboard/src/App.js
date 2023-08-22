import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProductsListPage from './pages/ProductsListPage';
import ProductPage from './pages/ProductPage';
import NotFoundPage from './pages/NotFoundPage';
import NavBar from './NavBar';

function App() {
  return (
    <BrowserRouter>
    <div className="App">
      <NavBar />
      <div id="page-body">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
          <Route path="/notfound" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
    </BrowserRouter>
  );
}

export default App;
