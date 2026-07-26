import { Customer } from '../../domain/customer/customer.entity';
import { CustomerRepository, UpsertCustomerInput } from '../../domain/customer/customer.repository';
import { UpsertCustomerUseCase } from './upsert-customer.use-case';

function buildCustomer(overrides: Partial<ConstructorParameters<typeof Customer>[0]> = {}): Customer {
  return new Customer({
    id: 'customer-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    documentId: '123456789',
    phone: '+573001234567',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('UpsertCustomerUseCase', () => {
  it('delegates to the repository and returns the upserted customer', async () => {
    const customer = buildCustomer();
    const customerRepository: jest.Mocked<CustomerRepository> = {
      findById: jest.fn(),
      upsertByDocumentId: jest.fn().mockResolvedValue(customer),
    };
    const input: UpsertCustomerInput = {
      name: customer.name,
      email: customer.email,
      documentId: customer.documentId,
      phone: customer.phone,
    };

    const useCase = new UpsertCustomerUseCase(customerRepository);
    const result = await useCase.execute(input);

    expect(result).toBe(customer);
    expect(customerRepository.upsertByDocumentId).toHaveBeenCalledWith(input);
  });
});
