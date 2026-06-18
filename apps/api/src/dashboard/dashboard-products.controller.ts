import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseSessionGuard } from '../core/common/guards/supabase-session.guard';
import { OrganizationContextGuard } from '../core/common/guards/organization-context.guard';
import { DashboardPermission } from './decorators/dashboard-permission.decorator';
import {
  CurrentDashboardUser,
  type DashboardUserContext,
} from './decorators/dashboard-user.decorator';
import { DashboardProductsService } from './dashboard-products.service';

@ApiExcludeController()
@ApiTags('Dashboard')
@Controller('dashboard/v1/organizations/:organizationId/products')
@UseGuards(SupabaseSessionGuard, OrganizationContextGuard)
@DashboardPermission('catalog.read')
export class DashboardProductsController {
  constructor(private readonly productsService: DashboardProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products for dashboard catalog' })
  list(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Query('isActive') isActiveStr?: string,
    @Query('productType')
    productType?: 'one_time' | 'recurring' | 'usage_based',
    @Query('search') search?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    const isActive =
      isActiveStr === undefined
        ? undefined
        : isActiveStr === 'true' || isActiveStr === '1';

    return this.productsService.listProducts(user, {
      isActive,
      search,
      limit,
      offset,
    });
  }
}
