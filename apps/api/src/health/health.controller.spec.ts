import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            checkReadiness: jest.fn().mockResolvedValue({
              ok: true,
              ready: true,
              service: 'lomi-api',
              checks: [{ name: 'redis_ping', ok: true }],
            }),
            checkRedis: jest.fn().mockResolvedValue({
              ok: true,
              status: 'ok',
              redis: 'connected',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns liveness payload', () => {
    const result = controller.liveness();
    expect(result.ok).toBe(true);
    expect(result.service).toBe('lomi-api');
    expect(typeof result.uptime).toBe('number');
  });
});
