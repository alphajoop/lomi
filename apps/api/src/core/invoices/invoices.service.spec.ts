import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('InvoicesService', () => {
  let service: InvoicesService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(InvoicesService);
  });

  it('calls list_customer_invoices_api with organization scope', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ invoice_id: 'inv-1' }],
      error: null,
    });

    const result = await service.findAll(user, 'draft', 'cust-1', 10, 0, 'INV');

    expect(result).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'list_customer_invoices_api',
      expect.objectContaining({
        p_organization_id: user.organizationId,
        p_status: 'draft',
        p_customer_id: 'cust-1',
        p_limit: 10,
        p_offset: 0,
        p_search: 'INV',
        p_environment: 'live',
      }),
    );
  });

  it('throws NotFoundException when invoice is missing', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('propagates RPC errors from findAll', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'invoice list failed' },
    });

    await expect(service.findAll(user)).rejects.toThrow('invoice list failed');
  });
});
