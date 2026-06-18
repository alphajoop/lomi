import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MetersService } from './meters.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';

describe('MetersService', () => {
  let service: MetersService;
  let mockSupabaseClient: { rpc: jest.Mock };

  const mockUser = {
    merchantId: 'merchant-1',
    organizationId: 'org-1',
    environment: 'test',
  } as AuthContext;

  beforeEach(async () => {
    mockSupabaseClient = {
      rpc: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetersService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => mockSupabaseClient,
          },
        },
      ],
    }).compile();

    service = module.get(MetersService);
  });

  it('scopes balance lookup to organization meters', async () => {
    mockSupabaseClient.rpc
      .mockResolvedValueOnce({
        data: {
          meter_id: 'meter-1',
          organization_id: 'org-1',
          name: 'api_calls',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            balance_id: 'bal-1',
            meter_id: 'meter-1',
            customer_id: 'cust-1',
            consumed_units: 10,
            credited_units: 0,
            balance: 10,
          },
        ],
        error: null,
      });

    const result = await service.getBalance('meter-1', 'cust-1', mockUser);

    expect(result).toEqual(
      expect.objectContaining({
        meter_id: 'meter-1',
        consumed_units: 10,
      }),
    );
    expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(
      1,
      'get_meter_api',
      expect.objectContaining({
        p_meter_id: 'meter-1',
        p_organization_id: 'org-1',
      }),
    );
  });

  it('throws when meter is not found', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

    await expect(service.findOne('missing', mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });
});
