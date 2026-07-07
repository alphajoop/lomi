import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DisputesService } from './disputes.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('DisputesService', () => {
  let service: DisputesService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(DisputesService);
  });

  it('calls fetch_disputes with organization scope', async () => {
    mock.rpc.mockResolvedValue({ data: [{ dispute_id: 'd-1' }], error: null });

    const result = await service.findAll(user, 'open', 1, 25);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'fetch_disputes',
      expect.objectContaining({
        p_organization_id: user.organizationId,
        p_status: 'open',
        p_page: 1,
        p_page_size: 25,
      }),
    );
  });

  it('throws NotFoundException when dispute is missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('maps fetch_disputes RPC errors to BadRequestException', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'bad input' } });

    await expect(service.findAll(user)).rejects.toThrow(BadRequestException);
  });
});
