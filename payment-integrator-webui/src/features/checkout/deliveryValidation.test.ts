import type { DeliveryFormData } from './checkoutSlice';
import { isDeliveryFormValid, validateDeliveryForm } from './deliveryValidation';

const validData: DeliveryFormData = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  documentId: '1020304050',
  phone: '+573001234567',
  address: 'Cra 1 # 2-3',
  city: 'Bogotá',
};

describe('validateDeliveryForm', () => {
  it('returns no errors for fully valid data', () => {
    expect(validateDeliveryForm(validData)).toEqual({});
    expect(isDeliveryFormValid(validData)).toBe(true);
  });

  it('flags every required field when empty', () => {
    const errors = validateDeliveryForm({
      name: '',
      email: '',
      documentId: '',
      phone: '',
      address: '',
      city: '',
    });

    expect(Object.keys(errors).sort()).toEqual(
      ['name', 'email', 'documentId', 'phone', 'address', 'city'].sort(),
    );
  });

  it('flags whitespace-only fields as empty', () => {
    expect(validateDeliveryForm({ ...validData, name: '   ' }).name).toBeDefined();
  });

  it('rejects a malformed email', () => {
    expect(validateDeliveryForm({ ...validData, email: 'not-an-email' }).email).toBeDefined();
  });

  it('accepts a phone without the country code prefix', () => {
    expect(validateDeliveryForm({ ...validData, phone: '3001234567' }).phone).toBeUndefined();
  });

  it('rejects a phone that is too short or has letters', () => {
    expect(validateDeliveryForm({ ...validData, phone: '123' }).phone).toBeDefined();
    expect(validateDeliveryForm({ ...validData, phone: '30012345ab' }).phone).toBeDefined();
  });
});
