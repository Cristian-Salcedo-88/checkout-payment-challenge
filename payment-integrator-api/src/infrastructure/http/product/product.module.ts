import { Module } from '@nestjs/common';
import { GetProductByIdUseCase } from '../../../application/product/get-product-by-id.use-case';
import { ListProductsUseCase } from '../../../application/product/list-products.use-case';
import { PersistenceModule } from '../../persistence/persistence.module';
import { ProductController } from './product.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [ProductController],
  providers: [ListProductsUseCase, GetProductByIdUseCase],
})
export class ProductModule {}
