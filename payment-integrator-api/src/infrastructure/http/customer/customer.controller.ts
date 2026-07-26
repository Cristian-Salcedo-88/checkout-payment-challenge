import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertCustomerUseCase } from '../../../application/customer/upsert-customer.use-case';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly upsertCustomerUseCase: UpsertCustomerUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create or update a customer by document id' })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  async upsert(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.upsertCustomerUseCase.execute(dto);
    return CustomerResponseDto.fromDomain(customer);
  }
}
