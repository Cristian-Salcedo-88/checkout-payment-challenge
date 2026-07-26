import { DeliveryStatus } from './delivery-status.enum';

export interface DeliveryProps {
  id: string;
  transactionId: string;
  customerId: string;
  address: string;
  city: string;
  status: DeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Delivery {
  constructor(private readonly props: DeliveryProps) {}

  get id(): string {
    return this.props.id;
  }

  get transactionId(): string {
    return this.props.transactionId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get address(): string {
    return this.props.address;
  }

  get city(): string {
    return this.props.city;
  }

  get status(): DeliveryStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
