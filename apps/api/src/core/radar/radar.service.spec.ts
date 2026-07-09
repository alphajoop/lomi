import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RadarService } from './radar.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('RadarService', () => {
  let service: RadarService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RadarService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(RadarService);
  });

  it('calls fetch_risk_assessments with organization scope', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ assessment_id: 'ra-1' }],
      error: null,
    });

    const result = await service.listAssessments(
      user,
      'blocked',
      'card',
      1,
      25,
    );

    expect(result.success).toBe(true);
    expect(mock.rpc).toHaveBeenCalledWith(
      'fetch_risk_assessments',
      expect.objectContaining({
        p_organization_id: user.organizationId,
        p_decision: 'blocked',
        p_rail: 'card',
      }),
    );
  });

  it('throws NotFoundException when assessment is missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('blocks charges when evaluate_radar_for_charge reports radar_charge_blocked', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'radar_charge_blocked: high risk' },
    });

    await expect(
      service.assertChargeAllowed(user, {
        amount: 1000,
        currencyCode: 'XOF',
        rail: 'card',
        customerId: 'cust-1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
