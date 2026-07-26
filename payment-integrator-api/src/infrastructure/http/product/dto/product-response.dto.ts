import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../../../domain/product/product.entity';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ description: 'Price in COP cents' })
  price: number;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  stock: number;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;
    dto.price = product.price;
    dto.imageUrl = product.imageUrl;
    dto.stock = product.stock;
    return dto;
  }
}
