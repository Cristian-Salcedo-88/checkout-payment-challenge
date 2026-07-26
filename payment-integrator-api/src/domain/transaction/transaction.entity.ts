import { TransactionStatus } from './transaction-status.enum';

export interface TransactionProps {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  amount: number;
  baseFee: number;
  deliveryFee: number;
  status: TransactionStatus;
  gatewayTransactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  constructor(private readonly props: TransactionProps) {}

  get id(): string {
    return this.props.id;
  }

  get reference(): string {
    return this.props.reference;
  }

  get productId(): string {
    return this.props.productId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get baseFee(): number {
    return this.props.baseFee;
  }

  get deliveryFee(): number {
    return this.props.deliveryFee;
  }

  get status(): TransactionStatus {
    return this.props.status;
  }

  get gatewayTransactionId(): string | null {
    return this.props.gatewayTransactionId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }
}
