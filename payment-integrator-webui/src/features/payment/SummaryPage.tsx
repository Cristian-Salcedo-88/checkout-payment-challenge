import { useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import Backdrop from '../../shared/components/Backdrop';
import Button from '../../shared/components/Button';
import { formatCents } from '../../shared/utils/currency';
import { calculateTotal } from './paymentCalculations';
import { confirmTransaction, pollTransactionStatus } from './paymentSlice';

import './SummaryPage.css';

const SummaryPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const product = useAppSelector((state) => state.product.current);
  const checkout = useAppSelector((state) => state.checkout);
  const payment = useAppSelector((state) => state.payment);

  useEffect(() => {
    // Resumes an interrupted confirmation exactly once, right after mount —
    // e.g. the user refreshed mid-payment. The persisted "confirming"/
    // "polling" phase no longer has a real request behind it (that promise
    // died with the page), so re-derive the truth straight from our backend
    // instead of showing a permanent, disconnected loading state.
    if (payment.transactionId && (payment.phase === 'confirming' || payment.phase === 'polling')) {
      dispatch(pollTransactionStatus(payment.transactionId));
    }
  }, []);

  useEffect(() => {
    if (payment.phase === 'done') {
      navigate('/result');
    }
  }, [payment.phase, navigate]);

  if (!product || !payment.transactionId) {
    return <Navigate to="/checkout" replace />;
  }

  const transactionId = payment.transactionId;
  const total = calculateTotal({
    productAmount: product.price,
    baseFee: payment.baseFee ?? 0,
    deliveryFee: payment.deliveryFee ?? 0,
  });
  const isProcessing = payment.phase === 'confirming' || payment.phase === 'polling';

  const handlePay = () => {
    if (!checkout.card.token) return;
    dispatch(
      confirmTransaction({
        transactionId,
        cardToken: checkout.card.token,
        deliveryAddress: checkout.delivery.address,
        deliveryCity: checkout.delivery.city,
      }),
    );
  };

  return (
    <main className="summary-page">
      <Backdrop>
        <h1 className="summary-title">Resumen de tu compra</h1>
        <p className="summary-product-name">{product.name}</p>

        <dl className="summary-lines">
          <div className="summary-line">
            <dt>Producto</dt>
            <dd>{formatCents(product.price)}</dd>
          </div>
          <div className="summary-line">
            <dt>Fee base</dt>
            <dd>{formatCents(payment.baseFee ?? 0)}</dd>
          </div>
          <div className="summary-line">
            <dt>Fee de envío</dt>
            <dd>{formatCents(payment.deliveryFee ?? 0)}</dd>
          </div>
          <div className="summary-line summary-total">
            <dt>Total</dt>
            <dd>{formatCents(total)}</dd>
          </div>
        </dl>

        {isProcessing && (
          <p className="summary-processing" role="status">
            {payment.phase === 'confirming'
              ? 'Estamos confirmando tu pago con el banco. Esto puede tardar hasta 20 segundos — no cierres ni recargues esta pantalla.'
              : 'Seguimos verificando el estado de tu pago…'}
          </p>
        )}

        {payment.phase === 'error' && (
          <p className="summary-error" role="alert">
            {payment.errorMessage ?? 'Ocurrió un error al procesar el pago.'}
          </p>
        )}

        {!checkout.card.token && (
          <p className="summary-error" role="alert">
            No encontramos los datos de tu tarjeta. <Link to="/checkout">Vuelve a ingresarla</Link>.
          </p>
        )}

        <Button onClick={handlePay} isLoading={isProcessing} disabled={!checkout.card.token}>
          Pagar
        </Button>
      </Backdrop>
    </main>
  );
};

export default SummaryPage;
