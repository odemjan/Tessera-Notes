import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from './logger';

describe('createLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes logs with the configured level and service name', () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stdout.write);

    const logger = createLogger({ logLevel: 'info' });
    logger.debug('hidden detail');
    logger.info({ requestId: 'req-123' }, 'request received');
    logger.flush();

    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0] ?? '')).toMatchObject({
      level: 30,
      service: 'tessera-server',
      requestId: 'req-123',
      msg: 'request received',
    });
  });

  it('redacts credentials and cookie fields from logged objects', () => {
    const writes: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stdout.write);

    const logger = createLogger({ logLevel: 'info' });
    logger.info(
      {
        request: {
          password: 'secret-password',
          token: 'secret-token',
          cookie: 'secret-cookie',
          authorization: 'Bearer secret-auth',
        },
        headers: {
          cookie: 'session=secret-cookie',
          authorization: 'Bearer secret-auth',
        },
      },
      'login attempt',
    );
    logger.flush();

    const line = writes[0] ?? '';
    const record = JSON.parse(line) as Record<string, unknown>;
    expect(record).toMatchObject({
      request: {
        password: '[redacted]',
        token: '[redacted]',
        cookie: '[redacted]',
        authorization: '[redacted]',
      },
      headers: {
        cookie: '[redacted]',
        authorization: '[redacted]',
      },
    });
    expect(line).not.toContain('secret');
  });
});
