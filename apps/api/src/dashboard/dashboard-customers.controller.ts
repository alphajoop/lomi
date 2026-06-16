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
import { DashboardCustomersService } from './dashboard-customers.service';

@ApiExcludeController()
@ApiTags('Dashboard')
@Controller('dashboard/v1/organizations/:organizationId/customers')
@UseGuards(SupabaseSessionGuard, OrganizationContextGuard)
@DashboardPermission('customer.read')
export class DashboardCustomersController {
  constructor(private readonly customersService: DashboardCustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers for dashboard' })
  list(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Query('searchTerm') searchTerm?: string,
    @Query('segment') segment?: string,
    @Query('customerType') customerType?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.customersService.listCustomers(user, {
      searchTerm,
      segment,
      customerType,
      limit,
      offset,
    });
  }
}
