import { Injectable } from '@nestjs/common';
import type { Delivery as PrismaDelivery } from '../../../../generated/prisma/client';
import type { TransactionContext } from '../../../common/transaction-context';
import { Delivery } from '../../../domain/delivery/delivery.entity';
import { CreateDeliveryInput, DeliveryRepository } from '../../../domain/delivery/delivery.repository';
import { PrismaService } from '../prisma/prisma.service';
import { resolvePrismaClient } from '../resolve-prisma-client';

function toDomain(record: PrismaDelivery): Delivery {
  return new Delivery({
    id: record.id,
    transactionId: record.transactionId,
    customerId: record.customerId,
    address: record.address,
    city: record.city,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

@Injectable()
export class DeliveryPrismaRepository implements DeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDeliveryInput, tx?: TransactionContext): Promise<Delivery> {
    const client = resolvePrismaClient(this.prisma, tx);
    const record = await client.delivery.create({ data: input });
    return toDomain(record);
  }
}
