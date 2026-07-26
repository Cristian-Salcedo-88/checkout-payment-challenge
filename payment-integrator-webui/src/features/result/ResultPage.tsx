import { Navigate, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { resetCheckout } from '../checkout/checkoutSlice';
import { resetPayment } from '../payment/paymentSlice';
import Button from '../../shared/components/Button';
import { formatCents } from '../../shared/utils/currency';

import './ResultPage.css';

const ResultPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const payment = useAppSelector((state) => state.payment);

  if (payment.phase !== 'done' || !payment.backendStatus) {
    return <Navigate to="/" replace />;
  }

  const isSuccess = payment.backendStatus === 'APPROVED';

  const handleBackToProduct = () => {
    // Clears checkout/payment state — including the payment provider card
    // token — but deliberately keeps the product slice so the redirect
    // below re-fetches that exact product's fresh stock instead of falling
    // back to the list.
    dispatch(resetCheckout());
    dispatch(resetPayment());
    navigate('/');
  };

  return (
    <main className="result-page">
      <div className={`result-card ${isSuccess ? 'result-success' : 'result-failure'}`}>
        <div className="result-icon" aria-hidden="true">
          {isSuccess ? '✓' : '✕'}
        </div>
        <h1 className="result-title">{isSuccess ? '¡Pago aprobado!' : 'El pago no se pudo completar'}</h1>
        <p className="result-message">
          {isSuccess
            ? 'Tu compra fue procesada exitosamente y el pedido está en camino.'
            : payment.backendStatus === 'DECLINED'
              ? 'Tu banco rechazó el pago. Puedes intentar con otra tarjeta.'
              : 'Ocurrió un error procesando tu pago. Intenta de nuevo más tarde.'}
        </p>

        <dl className="result-details">
          <div className="result-detail-row">
            <dt>Referencia</dt>
            <dd>{payment.reference}</dd>
          </div>
          <div className="result-detail-row">
            <dt>Monto</dt>
            <dd>{formatCents(payment.amount ?? 0)}</dd>
          </div>
        </dl>

        <Button onClick={handleBackToProduct}>Volver al producto</Button>
      </div>
    </main>
  );
};

export default ResultPage;
