import { logStructured } from './structured-console-logger';

describe('structured-console-logger', () => {
  it('writes JSON to console.log for normal events', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    logStructured({ event: 'test_event', request_id: 'req-1' });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"test_event"'),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('"request_id":"req-1"'),
    );
    spy.mockRestore();
  });

  it('writes JSON to console.error for failure events', () => {
    const spy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    logStructured({ event: 'payment_failed', message: 'boom' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
