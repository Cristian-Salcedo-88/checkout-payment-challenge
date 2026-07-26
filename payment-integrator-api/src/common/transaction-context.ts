/**
 * Opaque handle for an ambient persistence transaction. Domain ports accept
 * it so a use case can make multiple repositories participate in the same
 * atomic write, without the domain layer knowing anything about Prisma.
 */
export type TransactionContext = unknown;
