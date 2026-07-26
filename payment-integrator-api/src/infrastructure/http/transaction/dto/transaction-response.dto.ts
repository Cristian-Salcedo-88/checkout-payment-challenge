import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../../../../domain/transaction/transaction.entity';
import { TransactionStatus } from '../../../../domain/transaction/transaction-status.enum';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty({ description: 'Total charged, COP cents' })
  amount: number;

  @ApiProperty({ description: 'COP cents' })
  baseFee: number;

  @ApiProperty({ description: 'COP cents' })
  deliveryFee: number;

  @ApiProperty({ enum: Object.values(TransactionStatus) })
  status: TransactionStatus;

  @ApiProperty({ nullable: true, type: String })
  gatewayTransactionId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.id;
    dto.reference = transaction.reference;
    dto.productId = transaction.productId;
    dto.customerId = transaction.customerId;
    dto.amount = transaction.amount;
    dto.baseFee = transaction.baseFee;
    dto.deliveryFee = transaction.deliveryFee;
    dto.status = transaction.status;
    dto.gatewayTransactionId = transaction.gatewayTransactionId;
    dto.createdAt = transaction.createdAt;
    dto.updatedAt = transaction.updatedAt;
    return dto;
  }
}
