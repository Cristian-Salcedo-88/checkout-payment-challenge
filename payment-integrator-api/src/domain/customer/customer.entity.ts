export interface CustomerProps {
  id: string;
  name: string;
  email: string;
  documentId: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer {
  constructor(private readonly props: CustomerProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get documentId(): string {
    return this.props.documentId;
  }

  get phone(): string {
    return this.props.phone;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
