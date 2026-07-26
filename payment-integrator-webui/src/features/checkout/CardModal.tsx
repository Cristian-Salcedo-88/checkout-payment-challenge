import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { useAppDispatch } from '../../app/hooks';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import { tokenizeCard } from '../payment/paymentProviderClient';
import CardBrandLogo from './CardBrandLogo';
import { isCvvValid, isExpiryValid, validateCardNumber } from './cardValidation';
import { setCardToken } from './checkoutSlice';

import './CardModal.css';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CardFormFields {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardHolder: string;
}

const emptyForm: CardFormFields = { number: '', expMonth: '', expYear: '', cvc: '', cardHolder: '' };

function onlyDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

const CardModal = ({ isOpen, onClose, onSuccess }: CardModalProps) => {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<CardFormFields>(emptyForm);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const numberCheck = validateCardNumber(form.number);
  const expiryValid = isExpiryValid(form.expMonth, form.expYear);
  const cvvValid = isCvvValid(form.cvc, numberCheck.brand);
  const cardHolderValid = form.cardHolder.trim().length > 0;
  const formValid = numberCheck.valid && expiryValid && cvvValid && cardHolderValid;

  const resetForm = () => {
    setForm(emptyForm);
    setTouched(false);
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (!formValid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const token = await tokenizeCard({
        number: form.number,
        cvc: form.cvc,
        expMonth: form.expMonth,
        expYear: form.expYear,
        cardHolder: form.cardHolder.trim(),
      });
      dispatch(setCardToken({ token: token.id, brand: numberCheck.brand, lastFour: token.lastFour }));
      resetForm();
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo validar la tarjeta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Datos de la tarjeta">
      <form className="card-form" onSubmit={handleSubmit} noValidate>
        <label className="card-field">
          <span>Número de tarjeta</span>
          <div className="card-number-row">
            <input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={form.number}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, number: onlyDigits(event.target.value, 19) }))
              }
            />
            <CardBrandLogo brand={numberCheck.brand} />
          </div>
          {touched && !numberCheck.valid && (
            <span className="card-field-error">Número de tarjeta inválido.</span>
          )}
        </label>

        <label className="card-field">
          <span>Nombre en la tarjeta</span>
          <input
            autoComplete="cc-name"
            value={form.cardHolder}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, cardHolder: event.target.value }))
            }
          />
          {touched && !cardHolderValid && (
            <span className="card-field-error">Ingresa el nombre del titular.</span>
          )}
        </label>

        <div className="card-row">
          <label className="card-field">
            <span>Mes (MM)</span>
            <input
              inputMode="numeric"
              autoComplete="cc-exp-month"
              placeholder="08"
              value={form.expMonth}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, expMonth: onlyDigits(event.target.value, 2) }))
              }
            />
          </label>
          <label className="card-field">
            <span>Año (AA)</span>
            <input
              inputMode="numeric"
              autoComplete="cc-exp-year"
              placeholder="29"
              value={form.expYear}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, expYear: onlyDigits(event.target.value, 2) }))
              }
            />
          </label>
          <label className="card-field">
            <span>CVV</span>
            <input
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={form.cvc}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, cvc: onlyDigits(event.target.value, 4) }))
              }
            />
          </label>
        </div>
        {touched && !expiryValid && (
          <span className="card-field-error">Fecha de expiración inválida o vencida.</span>
        )}
        {touched && expiryValid && !cvvValid && <span className="card-field-error">CVV inválido.</span>}

        {submitError && (
          <p className="card-submit-error" role="alert">
            {submitError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Guardar tarjeta
        </Button>
      </form>
    </Modal>
  );
};

export default CardModal;
