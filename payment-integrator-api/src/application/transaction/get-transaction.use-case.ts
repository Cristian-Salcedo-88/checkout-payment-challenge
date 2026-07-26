import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../common/result';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { TransactionNotFoundError } from '../../domain/transaction/transaction.errors';
import { TRANSACTION_REPOSITORY, type TransactionRepository } from '../../domain/transaction/transaction.repository';

@Injectable()
export class GetTransactionUseCase {
  constructor(@Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepository) {}

  async execute(id: string): Promise<Result<Transaction, TransactionNotFoundError>> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      return Result.fail(new TransactionNotFoundError(id));
    }

    return Result.ok(transaction);
  }
}
