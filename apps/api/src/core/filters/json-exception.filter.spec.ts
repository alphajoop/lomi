import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { GlobalJsonExceptionFilter } from './json-exception.filter';

function mockHost(res: {
  status: jest.Mock;
  json: jest.Mock;
  setHeader: jest.Mock;
  headersSent: boolean;
}) {
  return {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ headers: {}, id: 'req-1' }),
    }),
  } as unknown as ArgumentsHost;
}

describe('GlobalJsonExceptionFilter', () => {
  const supabase = {
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  const filter = new GlobalJsonExceptionFilter(supabase as never);

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.LOG_HTTP_EXCEPTIONS;
  });

  it('formats ThrottlerException with Retry-After and rate_limit_exceeded', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      headersSent: false,
    };
    filter.catch(new ThrottlerException('Too many'), mockHost(res));
    expect(res.setHeader).toHaveBeenCalledWith(
      'Retry-After',
      expect.any(String),
    );
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'rate_limit_exceeded' }),
        request_id: 'req-1',
      }),
    );
  });

  it('formats HttpException with error envelope', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      headersSent: false,
    };
    filter.catch(
      new HttpException('Nope', HttpStatus.BAD_REQUEST),
      mockHost(res),
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'bad_request',
          message: 'Nope',
        }),
        request_id: 'req-1',
      }),
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('persists 503 to api_error_logs when LOG_HTTP_EXCEPTIONS is enabled', () => {
    process.env.LOG_HTTP_EXCEPTIONS = 'true';
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      headersSent: false,
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => ({
          headers: {},
          id: 'req-503',
          method: 'POST',
          path: '/charge/card',
          user: { organizationId: 'org-1' },
        }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(
      new HttpException('Unavailable', HttpStatus.SERVICE_UNAVAILABLE),
      host,
    );

    expect(supabase.rpc).toHaveBeenCalledWith(
      'log_api_error',
      expect.objectContaining({
        p_error_type: 'service_unavailable',
        p_request_id: 'req-503',
        p_response_status: 503,
      }),
    );
    delete process.env.LOG_HTTP_EXCEPTIONS;
  });
});
