import { Test, TestingModule } from '@nestjs/testing';
import { EdgeGuard } from './edge-guard.middleware';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('EdgeGuard', () => {
  let guard: EdgeGuard;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createGuard = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EdgeGuard],
    }).compile();

    return module.get<EdgeGuard>(EdgeGuard);
  };

  const createMockContext = (url: string, ip: string, apiKey?: string): ExecutionContext => {
    const req = {
      url,
      headers: {
        'x-api-key': apiKey,
        // Mocking x-forwarded-for handling if needed, but simple socket address is enough for now
      },
      socket: {
        remoteAddress: ip,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  };

  it('should be defined', async () => {
    guard = await createGuard();
    expect(guard).toBeDefined();
  });

  it('should allow access when no restrictions are enabled', async () => {
    process.env.ENFORCE_IP_ALLOWLIST = 'false';
    process.env.ENFORCE_API_KEY = 'false';
    guard = await createGuard();

    const context = createMockContext('/api/test', '127.0.0.1');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should skip checks for non-api routes', async () => {
    process.env.ENFORCE_IP_ALLOWLIST = 'true';
    guard = await createGuard();

    const context = createMockContext('/health', '10.0.0.99'); // unauthorized IP
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should block unauthorized IP when whitelist is enforced', async () => {
    process.env.ENFORCE_IP_ALLOWLIST = 'true';
    process.env.ALLOWED_IPS = '127.0.0.1, 192.168.1.1';
    guard = await createGuard();

    const context = createMockContext('/api/test', '10.0.0.99');
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow authorized IP when whitelist is enforced', async () => {
    process.env.ENFORCE_IP_ALLOWLIST = 'true';
    process.env.ALLOWED_IPS = '127.0.0.1, 192.168.1.1';
    guard = await createGuard();

    const context = createMockContext('/api/test', '192.168.1.1');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should block missing API key when enforced', async () => {
    process.env.ENFORCE_API_KEY = 'true';
    process.env.VALID_API_KEYS = 'secret123';
    guard = await createGuard();

    const context = createMockContext('/api/test', '127.0.0.1'); // No key
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should block invalid API key when enforced', async () => {
    process.env.ENFORCE_API_KEY = 'true';
    process.env.VALID_API_KEYS = 'secret123';
    guard = await createGuard();

    const context = createMockContext('/api/test', '127.0.0.1', 'wrong-key');
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow valid API key when enforced', async () => {
    process.env.ENFORCE_API_KEY = 'true';
    process.env.VALID_API_KEYS = 'secret123, key456';
    guard = await createGuard();

    const context = createMockContext('/api/test', '127.0.0.1', 'key456');
    expect(guard.canActivate(context)).toBe(true);
  });
});
