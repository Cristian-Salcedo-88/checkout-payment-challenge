import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../common/result';
import { Product } from '../../domain/product/product.entity';
import { ProductNotFoundError } from '../../domain/product/product.errors';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/product/product.repository';

@Injectable()
export class GetProductByIdUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository) {}

  async execute(id: string): Promise<Result<Product, ProductNotFoundError>> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      return Result.fail(new ProductNotFoundError(id));
    }

    return Result.ok(product);
  }
}
