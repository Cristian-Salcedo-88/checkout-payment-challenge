import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createTransaction } from '../payment/paymentSlice';
import Button from '../../shared/components/Button';
import CardModal from './CardModal';
import { submitCustomer } from './checkoutSlice';
import DeliveryForm from './DeliveryForm';
import { isDeliveryFormValid } from './deliveryValidation';

import './CheckoutPage.css';

const CheckoutPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const product = useAppSelector((state) => state.product.current);
  const checkout = useAppSelector((state) => state.checkout);

  const [isCardModalOpen, setCardModalOpen] = useState(false);
  const [showDeliveryErrors, setShowDeliveryErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const deliveryValid = isDeliveryFormValid(checkout.delivery);
  const hasCard = Boolean(checkout.card.token);

  const handleContinue = async () => {
    setShowDeliveryErrors(true);
    if (!deliveryValid || !hasCard) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const customer = await dispatch(submitCustomer(checkout.delivery)).unwrap();
      await dispatch(createTransaction({ productId: product.id, customerId: customer.id })).unwrap();
      navigate('/summary');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo continuar con la compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-card">
        <h1 className="checkout-title">Datos de entrega</h1>
        <DeliveryForm showErrors={showDeliveryErrors} />

        <div className="checkout-card-section">
          <h2 className="checkout-subtitle">Tarjeta</h2>
          {hasCard ? (
            <div className="checkout-card-summary">
              <span>
                {checkout.card.brand.toUpperCase()} •••• {checkout.card.lastFour}
              </span>
              <button type="button" className="checkout-change-card" onClick={() => setCardModalOpen(true)}>
                Cambiar
              </button>
            </div>
          ) : (
            <Button variant="secondary" type="button" onClick={() => setCardModalOpen(true)}>
              Agregar tarjeta
            </Button>
          )}
          {showDeliveryErrors && !hasCard && (
            <p className="checkout-field-error">Agrega una tarjeta para continuar.</p>
          )}
        </div>

        {submitError && (
          <p className="checkout-submit-error" role="alert">
            {submitError}
          </p>
        )}

        <Button onClick={handleContinue} isLoading={isSubmitting}>
          Continuar
        </Button>
      </div>

      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setCardModalOpen(false)}
        onSuccess={() => setCardModalOpen(false)}
      />
    </main>
  );
};

export default CheckoutPage;
