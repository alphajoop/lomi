import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { AuthContext } from '../common/decorators/current-user.decorator';

describe('PaymentRequestsController', () => {
  let controller: PaymentRequestsController;
  let service: jest.Mocked<
    Pick<PaymentRequestsService, 'create' | 'findAll' | 'findOne'>
  >;

  const user = {
    merchantId: 'merch_1',
    organizationId: 'org_1',
    environment: 'test',
  } as AuthContext;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentRequestsController],
      providers: [{ provide: PaymentRequestsService, useValue: service }],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PaymentRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to service', async () => {
    const dto = {
      amount: 1,
      currency_code: 'XOF',
      expiry_date: '2026-01-01T00:00:00.000Z',
    } as CreatePaymentRequestDto;
    service.create.mockResolvedValue({ data: { request_id: 'pr_1' } } as any);

    const result = await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(dto, user, undefined);
    expect(result).toEqual({ request_id: 'pr_1' });
  });

  it('findAll forwards query params to service', async () => {
    service.findAll.mockResolvedValue({
      data: [],
      total: 0,
      limit: 10,
      offset: 5,
    });

    const result = await controller.findAll(
      user,
      'pending',
      '123e4567-e89b-12d3-a456-426614174000',
      10,
      5,
    );

    expect(service.findAll).toHaveBeenCalledWith(
      user,
      'pending',
      '123e4567-e89b-12d3-a456-426614174000',
      10,
      5,
    );
    expect(result.total).toBe(0);
  });

  it('findOne delegates to service', async () => {
    service.findOne.mockResolvedValue({ request_id: 'pr_1' } as any);
    const result = (await controller.findOne('pr_1', user)) as {
      request_id: string;
    };
    expect(service.findOne).toHaveBeenCalledWith('pr_1', user);
    expect(result.request_id).toBe('pr_1');
  });
});
