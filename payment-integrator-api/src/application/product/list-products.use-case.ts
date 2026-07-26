import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/product/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/product/product.repository';

@Injectable()
export class ListProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository) {}

  execute(): Promise<Product[]> {
    return this.productRepository.findAllInStock();
  }
}
