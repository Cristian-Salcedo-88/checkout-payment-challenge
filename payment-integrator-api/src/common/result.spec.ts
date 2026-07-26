import { Result } from './result';

describe('Result', () => {
  it('creates a successful result carrying a value', () => {
    const result = Result.ok<number, string>(42);

    expect(result.isOk).toBe(true);
    expect(result.isErr).toBe(false);
    expect(result.value).toBe(42);
  });

  it('creates a failed result carrying an error', () => {
    const result = Result.fail<number, string>('boom');

    expect(result.isErr).toBe(true);
    expect(result.isOk).toBe(false);
    expect(result.error).toBe('boom');
  });

  it('throws when reading the value of a failed result', () => {
    const result = Result.fail<number, string>('boom');

    expect(() => result.value).toThrow();
  });

  it('throws when reading the error of a successful result', () => {
    const result = Result.ok<number, string>(42);

    expect(() => result.error).toThrow();
  });

  describe('map', () => {
    it('transforms the value on success', () => {
      const result = Result.ok<number, string>(2).map((n) => n * 10);

      expect(result.value).toBe(20);
    });

    it('passes the error through unchanged on failure', () => {
      const result = Result.fail<number, string>('boom').map((n) => n * 10);

      expect(result.isErr).toBe(true);
      expect(result.error).toBe('boom');
    });
  });

  describe('mapErr', () => {
    it('transforms the error on failure', () => {
      const result = Result.fail<number, string>('boom').mapErr((e) => e.toUpperCase());

      expect(result.error).toBe('BOOM');
    });

    it('passes the value through unchanged on success', () => {
      const result = Result.ok<number, string>(2).mapErr((e) => e.toUpperCase());

      expect(result.value).toBe(2);
    });
  });

  describe('andThen', () => {
    it('chains to the next result on success', () => {
      const result = Result.ok<number, string>(2).andThen((n) => Result.ok<number, string>(n + 1));

      expect(result.value).toBe(3);
    });

    it('short-circuits without calling the next step on failure', () => {
      const next = jest.fn();
      const result = Result.fail<number, string>('boom').andThen(next);

      expect(next).not.toHaveBeenCalled();
      expect(result.error).toBe('boom');
    });
  });

  describe('match', () => {
    it('invokes the ok handler on success', () => {
      const output = Result.ok<number, string>(2).match({
        ok: (value) => `value:${value}`,
        err: (error) => `error:${error}`,
      });

      expect(output).toBe('value:2');
    });

    it('invokes the err handler on failure', () => {
      const output = Result.fail<number, string>('boom').match({
        ok: (value) => `value:${value}`,
        err: (error) => `error:${error}`,
      });

      expect(output).toBe('error:boom');
    });
  });
});
