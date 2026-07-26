import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetProductByIdUseCase } from '../../../application/product/get-product-by-id.use-case';
import { ListProductsUseCase } from '../../../application/product/list-products.use-case';
import { toHttpException } from '../to-http-exception';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List products with available stock' })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.listProductsUseCase.execute();
    return products.map((product) => ProductResponseDto.fromDomain(product));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiOkResponse({ type: ProductResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    const result = await this.getProductByIdUseCase.execute(id);

    return result.match({
      ok: (product) => ProductResponseDto.fromDomain(product),
      err: (error) => {
        throw toHttpException(error);
      },
    });
  }
}
