import { Injectable } from '@nestjs/common';
import type { Customer as PrismaCustomer } from '../../../../generated/prisma/client';
import { Customer } from '../../../domain/customer/customer.entity';
import { CustomerRepository, UpsertCustomerInput } from '../../../domain/customer/customer.repository';
import { PrismaService } from '../prisma/prisma.service';

function toDomain(record: PrismaCustomer): Customer {
  return new Customer({
    id: record.id,
    name: record.name,
    email: record.email,
    documentId: record.documentId,
    phone: record.phone,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

@Injectable()
export class CustomerPrismaRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Customer | null> {
    const record = await this.prisma.customer.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async upsertByDocumentId(input: UpsertCustomerInput): Promise<Customer> {
    const record = await this.prisma.customer.upsert({
      where: { documentId: input.documentId },
      create: input,
      update: { name: input.name, email: input.email, phone: input.phone },
    });
    return toDomain(record);
  }
}
