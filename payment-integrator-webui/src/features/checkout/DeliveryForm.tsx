import type { ChangeEvent } from 'react';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateDeliveryField } from './checkoutSlice';
import type { DeliveryFormData } from './checkoutSlice';
import { validateDeliveryForm } from './deliveryValidation';

import './DeliveryForm.css';

interface FieldConfig {
  name: keyof DeliveryFormData;
  label: string;
  autoComplete: string;
  type?: string;
}

const FIELDS: FieldConfig[] = [
  { name: 'name', label: 'Nombre completo', autoComplete: 'name' },
  { name: 'email', label: 'Correo electrónico', autoComplete: 'email', type: 'email' },
  { name: 'documentId', label: 'Documento de identidad', autoComplete: 'off' },
  { name: 'phone', label: 'Teléfono', autoComplete: 'tel', type: 'tel' },
  { name: 'address', label: 'Dirección', autoComplete: 'street-address' },
  { name: 'city', label: 'Ciudad', autoComplete: 'address-level2' },
];

interface DeliveryFormProps {
  showErrors: boolean;
}

const DeliveryForm = ({ showErrors }: DeliveryFormProps) => {
  const dispatch = useAppDispatch();
  const delivery = useAppSelector((state) => state.checkout.delivery);
  const errors = validateDeliveryForm(delivery);

  const handleChange = (field: keyof DeliveryFormData) => (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(updateDeliveryField({ field, value: event.target.value }));
  };

  return (
    <div className="delivery-form">
      {FIELDS.map(({ name, label, autoComplete, type }) => (
        <label className="delivery-field" key={name}>
          <span>{label}</span>
          <input
            type={type ?? 'text'}
            autoComplete={autoComplete}
            value={delivery[name]}
            onChange={handleChange(name)}
          />
          {showErrors && errors[name] && <span className="delivery-field-error">{errors[name]}</span>}
        </label>
      ))}
    </div>
  );
};

export default DeliveryForm;
