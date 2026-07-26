import { Product } from '../../domain/product/product.entity';
import { ProductNotFoundError } from '../../domain/product/product.errors';
import { ProductRepository } from '../../domain/product/product.repository';
import { GetProductByIdUseCase } from './get-product-by-id.use-case';

function buildProduct(overrides: Partial<ConstructorParameters<typeof Product>[0]> = {}): Product {
  return new Product({
    id: 'product-1',
    name: 'Test Mug',
    description: 'A mug',
    price: 20000,
    imageUrl: 'http://example.com/mug.png',
    stock: 5,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function buildRepository(overrides: Partial<jest.Mocked<ProductRepository>> = {}): jest.Mocked<ProductRepository> {
  return {
    findAllInStock: jest.fn(),
    findById: jest.fn(),
    decrementStock: jest.fn(),
    incrementStock: jest.fn(),
    ...overrides,
  };
}

describe('GetProductByIdUseCase', () => {
  it('returns Ok with the product when it exists', async () => {
    const product = buildProduct();
    const productRepository = buildRepository({ findById: jest.fn().mockResolvedValue(product) });

    const useCase = new GetProductByIdUseCase(productRepository);
    const result = await useCase.execute('product-1');

    expect(result.isOk).toBe(true);
    expect(result.value).toBe(product);
    expect(productRepository.findById).toHaveBeenCalledWith('product-1');
  });

  it('returns Err with ProductNotFoundError when the product does not exist', async () => {
    const productRepository = buildRepository({ findById: jest.fn().mockResolvedValue(null) });

    const useCase = new GetProductByIdUseCase(productRepository);
    const result = await useCase.execute('missing-id');

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ProductNotFoundError);
    expect(result.error.code).toBe('PRODUCT_NOT_FOUND');
  });
});
