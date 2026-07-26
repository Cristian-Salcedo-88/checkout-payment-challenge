export class Result<T, E> {
  private constructor(
    private readonly success: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T, E = never>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  static fail<T = never, E = unknown>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  get isOk(): boolean {
    return this.success;
  }

  get isErr(): boolean {
    return !this.success;
  }

  get value(): T {
    if (!this.success) {
      throw new Error('Cannot read the value of a failed Result. Check isOk first.');
    }
    return this._value as T;
  }

  get error(): E {
    if (this.success) {
      throw new Error('Cannot read the error of a successful Result. Check isErr first.');
    }
    return this._error as E;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.success ? Result.ok(fn(this._value as T)) : Result.fail(this._error as E);
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return this.success ? Result.ok(this._value as T) : Result.fail(fn(this._error as E));
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return this.success ? fn(this._value as T) : Result.fail(this._error as E);
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    return this.success ? handlers.ok(this._value as T) : handlers.err(this._error as E);
  }
}
