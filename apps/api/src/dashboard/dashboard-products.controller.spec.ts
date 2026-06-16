import { Test, TestingModule } from '@nestjs/testing';
import { DashboardProductsController } from './dashboard-products.controller';
import { DashboardProductsService } from './dashboard-products.service';
import { SupabaseSessionGuard } from '../core/common/guards/supabase-session.guard';
import { OrganizationContextGuard } from '../core/common/guards/organization-context.guard';
import type { DashboardUserContext } from './decorators/dashboard-user.decorator';

describe('DashboardProductsController', () => {
  let controller: DashboardProductsController;
  let productsService: jest.Mocked<
    Pick<DashboardProductsService, 'listProducts'>
  >;

  const user: DashboardUserContext = {
    merchantId: 'merchant-1',
    organizationId: 'org-1',
    environment: 'live',
  };

  beforeEach(async () => {
    productsService = {
      listProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardProductsController],
      providers: [
        { provide: DashboardProductsService, useValue: productsService },
      ],
    })
      .overrideGuard(SupabaseSessionGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrganizationContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(DashboardProductsController);
  });

  it('passes parsed query params to the service', async () => {
    productsService.listProducts.mockResolvedValue({
      products: [],
      total_count: 0,
    });

    await controller.list(user, 'true', 'one_time', 'coffee', 20, 5);

    expect(productsService.listProducts).toHaveBeenCalledWith(user, {
      isActive: true,
      search: 'coffee',
      limit: 20,
      offset: 5,
    });
  });
});
