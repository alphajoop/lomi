import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(OrganizationsService);
  });

  it('calls list_organizations for the authenticated organization', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ organization_id: user.organizationId, name: 'Acme' }],
      error: null,
    });

    const result = await service.findAll(user);

    expect(result).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith('list_organizations', {
      p_organization_id: user.organizationId,
    });
  });

  it('denies access to a different organization id', async () => {
    await expect(
      service.findOne('00000000-0000-0000-0000-000000000001', user),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when metrics are missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(service.getMetrics(user)).rejects.toThrow(NotFoundException);
  });

  it('maps list_organizations RPC errors to InternalServerErrorException', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'db error' } });

    await expect(service.findAll(user)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
