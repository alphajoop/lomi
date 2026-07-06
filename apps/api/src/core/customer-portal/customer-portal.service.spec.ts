import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerPortalService } from './customer-portal.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase } from '../__tests__/mock-supabase';
import type { PortalSessionContext } from './portal-session.guard';

describe('CustomerPortalService', () => {
  let service: CustomerPortalService;
  const mock = createMockSupabase();
  const session: PortalSessionContext = {
    sessionToken: 'session-token',
    customerId: 'cust-1',
    organizationId: 'org-1',
    merchantId: 'merchant-1',
    environment: 'live',
  };

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerPortalService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(CustomerPortalService);
  });

  it('validates session via customer_portal_validate_session RPC', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ customer_id: 'cust-1', email: 'a@b.com' }],
      error: null,
    });

    const result = await service.getMe(session);

    expect(result).toEqual({ customer_id: 'cust-1', email: 'a@b.com' });
    expect(mock.rpc).toHaveBeenCalledWith('customer_portal_validate_session', {
      p_session_token: 'session-token',
    });
  });

  it('maps list payment methods RPC errors to BadRequestException', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'invalid session' } });

    await expect(service.listPaymentMethods(session)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('requires a configured SPI alias for customer QR', async () => {
    mock.rpc.mockResolvedValue({ data: '  ', error: null });

    await expect(service.getSpiCustomerQr(session)).rejects.toThrow(
      BadRequestException,
    );
  });
});
