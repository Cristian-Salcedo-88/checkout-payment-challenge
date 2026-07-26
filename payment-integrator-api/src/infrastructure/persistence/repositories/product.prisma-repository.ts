import { Injectable } from '@nestjs/common';
import type { Product as PrismaProduct } from '../../../../generated/prisma/client';
import type { TransactionContext } from '../../../common/transaction-context';
import { Product } from '../../../domain/product/product.entity';
import { ProductRepository } from '../../../domain/product/product.repository';
import { PrismaService } from '../prisma/prisma.service';
import { resolvePrismaClient } from '../resolve-prisma-client';

function toDomain(record: PrismaProduct): Product {
  return new Product({
    id: record.id,
    name: record.name,
    description: record.description,
    price: record.price,
    imageUrl: record.imageUrl,
    stock: record.stock,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

@Injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async findAllInStock(): Promise<Product[]> {
    const records = await this.prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toDomain);
  }

  async decrementStock(id: string, quantity: number, tx?: TransactionContext): Promise<boolean> {
    const client = resolvePrismaClient(this.prisma, tx);
    const { count } = await client.product.updateMany({
      where: { id, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    return count > 0;
  }

  async incrementStock(id: string, quantity: number, tx?: TransactionContext): Promise<void> {
    const client = resolvePrismaClient(this.prisma, tx);
    await client.product.updateMany({
      where: { id },
      data: { stock: { increment: quantity } },
    });
  }
}
