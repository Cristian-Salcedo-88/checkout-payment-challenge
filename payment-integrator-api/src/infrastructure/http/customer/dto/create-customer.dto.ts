import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1020304050' })
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({ example: '+573001234567' })
  @IsPhoneNumber('CO')
  phone: string;
}
