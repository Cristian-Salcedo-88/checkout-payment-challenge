import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import Button from '../../shared/components/Button';
import { formatCents } from '../../shared/utils/currency';
import { loadProduct } from './productSlice';

import './ProductPage.css';

const ProductPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { current: product, status, error } = useAppSelector((state) => state.product);

  useEffect(() => {
    // Runs once per mount — including the redirect back here once the
    // payment flow resolves — so stock is always re-fetched, never trusted
    // from stale persisted state. If we already know the product's id,
    // refresh that exact one; otherwise this is the very first load.
    dispatch(loadProduct(product?.id));
  }, [dispatch]);

  if (status === 'loading' && !product) {
    return (
      <main className="product-page">
        <p>Cargando producto…</p>
      </main>
    );
  }

  if (status === 'failed' && !product) {
    return (
      <main className="product-page">
        <p role="alert">{error ?? 'No se pudo cargar el producto.'}</p>
        <Button onClick={() => dispatch(loadProduct(undefined))}>Reintentar</Button>
      </main>
    );
  }

  if (!product) return null;

  const outOfStock = product.stock <= 0;

  return (
    <main className="product-page">
      <div className="product-card">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="product-image" />
        )}
        <h1 className="product-name">{product.name}</h1>
        <p className="product-description">{product.description}</p>
        <p className="product-price">{formatCents(product.price)}</p>
        <p className={outOfStock ? 'product-stock product-stock-out' : 'product-stock'}>
          {outOfStock ? 'Sin stock disponible' : `${product.stock} unidades disponibles`}
        </p>
        <Button disabled={outOfStock} onClick={() => navigate('/checkout')}>
          Comprar
        </Button>
      </div>
    </main>
  );
};

export default ProductPage;
