import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../../../domain/customer/customer.entity';

export class CustomerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  phone: string;

  static fromDomain(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.id = customer.id;
    dto.name = customer.name;
    dto.email = customer.email;
    dto.documentId = customer.documentId;
    dto.phone = customer.phone;
    return dto;
  }
}
