import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfirmPaymentUseCase } from '../../../application/transaction/confirm-payment.use-case';
import { CreateTransactionUseCase } from '../../../application/transaction/create-transaction.use-case';
import { GetTransactionUseCase } from '../../../application/transaction/get-transaction.use-case';
import { toHttpException } from '../to-http-exception';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a PENDING transaction for a product' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  async create(@Body() dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    const result = await this.createTransactionUseCase.execute(dto);

    return result.match({
      ok: (transaction) => TransactionResponseDto.fromDomain(transaction),
      err: (error) => {
        throw toHttpException(error);
      },
    });
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm payment with a payment gateway card token' })
  @ApiOkResponse({ type: TransactionResponseDto })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPaymentDto,
  ): Promise<TransactionResponseDto> {
    const result = await this.confirmPaymentUseCase.execute({ transactionId: id, ...dto });

    return result.match({
      ok: (transaction) => TransactionResponseDto.fromDomain(transaction),
      err: (error) => {
        throw toHttpException(error);
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction status (for polling)' })
  @ApiOkResponse({ type: TransactionResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TransactionResponseDto> {
    const result = await this.getTransactionUseCase.execute(id);

    return result.match({
      ok: (transaction) => TransactionResponseDto.fromDomain(transaction),
      err: (error) => {
        throw toHttpException(error);
      },
    });
  }
}
