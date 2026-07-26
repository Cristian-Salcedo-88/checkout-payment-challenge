import paymentReducer, {
  confirmTransaction,
  createTransaction,
  pollTransactionStatus,
  resetPayment,
} from './paymentSlice';
import type { PaymentState, TransactionResponseDto } from './paymentSlice';

const initialState: PaymentState = {
  transactionId: null,
  reference: null,
  backendStatus: null,
  phase: 'idle',
  amount: null,
  baseFee: null,
  deliveryFee: null,
  errorMessage: null,
};

const transaction: TransactionResponseDto = {
  id: 'txn_1',
  reference: 'ref_1',
  productId: 'prod_1',
  customerId: 'cust_1',
  amount: 4730000,
  baseFee: 150000,
  deliveryFee: 80000,
  status: 'PENDING',
  paymentProviderTransactionId: null,
  createdAt: '2026-07-25T00:00:00.000Z',
  updatedAt: '2026-07-25T00:00:00.000Z',
};

describe('paymentSlice', () => {
  it('sets phase to creating on createTransaction.pending', () => {
    const state = paymentReducer(initialState, { type: createTransaction.pending.type });
    expect(state.phase).toBe('creating');
  });

  it('stores the transaction details on createTransaction.fulfilled', () => {
    const state = paymentReducer(initialState, {
      type: createTransaction.fulfilled.type,
      payload: transaction,
    });

    expect(state.transactionId).toBe('txn_1');
    expect(state.reference).toBe('ref_1');
    expect(state.amount).toBe(4730000);
    expect(state.baseFee).toBe(150000);
    expect(state.deliveryFee).toBe(80000);
    expect(state.backendStatus).toBe('PENDING');
    expect(state.phase).toBe('idle');
  });

  it('marks phase as error on createTransaction.rejected', () => {
    const state = paymentReducer(initialState, {
      type: createTransaction.rejected.type,
      error: { message: 'boom' },
    });
    expect(state.phase).toBe('error');
    expect(state.errorMessage).toBe('boom');
  });

  it('sets phase to confirming on confirmTransaction.pending', () => {
    const state = paymentReducer(initialState, { type: confirmTransaction.pending.type });
    expect(state.phase).toBe('confirming');
  });

  it('marks phase done when confirmTransaction resolves to a terminal status', () => {
    const state = paymentReducer(initialState, {
      type: confirmTransaction.fulfilled.type,
      payload: { ...transaction, status: 'APPROVED' },
    });
    expect(state.backendStatus).toBe('APPROVED');
    expect(state.phase).toBe('done');
  });

  it('falls back to polling when confirmTransaction resolves still PENDING', () => {
    const state = paymentReducer(initialState, {
      type: confirmTransaction.fulfilled.type,
      payload: { ...transaction, status: 'PENDING' },
    });
    expect(state.phase).toBe('polling');
  });

  it('marks phase as error on confirmTransaction.rejected', () => {
    const state = paymentReducer(initialState, {
      type: confirmTransaction.rejected.type,
      error: { message: 'gateway down' },
    });
    expect(state.phase).toBe('error');
    expect(state.errorMessage).toBe('gateway down');
  });

  it('resolves polling to done with the final backend status', () => {
    const state = paymentReducer(initialState, {
      type: pollTransactionStatus.fulfilled.type,
      payload: { ...transaction, status: 'DECLINED' },
    });
    expect(state.backendStatus).toBe('DECLINED');
    expect(state.phase).toBe('done');
  });

  it('resets to the initial state', () => {
    const dirty: PaymentState = {
      transactionId: 'txn_1',
      reference: 'ref_1',
      backendStatus: 'APPROVED',
      phase: 'done',
      amount: 4730000,
      baseFee: 150000,
      deliveryFee: 80000,
      errorMessage: null,
    };
    expect(paymentReducer(dirty, resetPayment())).toEqual(initialState);
  });
});
