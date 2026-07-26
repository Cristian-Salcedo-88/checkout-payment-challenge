import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'Card token obtained by the frontend from the payment gateway (public key tokenization)' })
  @IsString()
  @IsNotEmpty()
  cardToken: string;

  @ApiProperty({ example: 'Cra 1 # 2-3' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  @IsNotEmpty()
  deliveryCity: string;
}
