import type { DeliveryFormData } from './checkoutSlice';

export type DeliveryFormErrors = Partial<Record<keyof DeliveryFormData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts an optional leading "+" followed by 7-15 digits (E.164-ish),
// tolerant of spaces/dashes the user may type.
const PHONE_REGEX = /^\+?\d{7,15}$/;

export function validateDeliveryForm(data: DeliveryFormData): DeliveryFormErrors {
  const errors: DeliveryFormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'El nombre es obligatorio.';
  }

  if (!data.email.trim()) {
    errors.email = 'El correo es obligatorio.';
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Ingresa un correo válido.';
  }

  if (!data.documentId.trim()) {
    errors.documentId = 'El documento es obligatorio.';
  }

  if (!data.phone.trim()) {
    errors.phone = 'El teléfono es obligatorio.';
  } else if (!PHONE_REGEX.test(data.phone.trim().replace(/[\s-]/g, ''))) {
    errors.phone = 'Ingresa un teléfono válido (7 a 15 dígitos, puede incluir +).';
  }

  if (!data.address.trim()) {
    errors.address = 'La dirección es obligatoria.';
  }

  if (!data.city.trim()) {
    errors.city = 'La ciudad es obligatoria.';
  }

  return errors;
}

export function isDeliveryFormValid(data: DeliveryFormData): boolean {
  return Object.keys(validateDeliveryForm(data)).length === 0;
}
