import { Product } from '../../domain/product/product.entity';
import { ProductRepository } from '../../domain/product/product.repository';
import { ListProductsUseCase } from './list-products.use-case';

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

describe('ListProductsUseCase', () => {
  it('returns the products with available stock from the repository', async () => {
    const products = [buildProduct(), buildProduct({ id: 'product-2' })];
    const productRepository: jest.Mocked<ProductRepository> = {
      findAllInStock: jest.fn().mockResolvedValue(products),
      findById: jest.fn(),
      decrementStock: jest.fn(),
      incrementStock: jest.fn(),
    };

    const useCase = new ListProductsUseCase(productRepository);
    const result = await useCase.execute();

    expect(result).toBe(products);
    expect(productRepository.findAllInStock).toHaveBeenCalledTimes(1);
  });
});
