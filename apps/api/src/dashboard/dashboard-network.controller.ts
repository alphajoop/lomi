import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { DashboardNetworkService } from './dashboard-network.service';

@ApiExcludeController()
@ApiTags('Dashboard')
@Controller('dashboard/v1/organizations/:organizationId/network')
@UseGuards(SupabaseSessionGuard, OrganizationContextGuard)
export class DashboardNetworkController {
  constructor(private readonly networkService: DashboardNetworkService) {}

  @Get('context')
  @DashboardPermission('network.view')
  @ApiOperation({ summary: 'Network organization context' })
  getContext(@CurrentDashboardUser() user: DashboardUserContext) {
    return this.networkService.getContext(user);
  }

  @Get('members')
  @DashboardPermission('network.members.view')
  @ApiOperation({ summary: 'List network members' })
  listMembers(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Query('search') search?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.networkService.listMembers(user, { search, limit, offset });
  }

  @Get('enrollments')
  @DashboardPermission('network.enrollments.view')
  @ApiOperation({ summary: 'List network enrollment sessions' })
  listEnrollments(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.networkService.listEnrollments(user, { limit, offset });
  }

  @Post('enrollments')
  @DashboardPermission('network.enrollments.create')
  @ApiOperation({ summary: 'Create network enrollment invite' })
  createEnrollment(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Body()
    body: {
      intended_email?: string;
      requested_capabilities?: string[];
      expires_at?: string;
      terms_version?: string;
    },
  ) {
    return this.networkService.createEnrollment(user, body);
  }

  @Get('transactions')
  @DashboardPermission('network.payments.view')
  @ApiOperation({ summary: 'List delegated network transactions' })
  listTransactions(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Query('memberOrganizationId') memberOrganizationId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.networkService.listTransactions(user, {
      memberOrganizationId,
      limit,
      offset,
    });
  }

  @Get('fees/entries')
  @DashboardPermission('network.fees.view')
  listFeeEntries(@CurrentDashboardUser() user: DashboardUserContext) {
    return this.networkService.listFeeEntries(user);
  }

  @Get('fees/rules')
  @DashboardPermission('network.fees.view')
  listFeeRules(@CurrentDashboardUser() user: DashboardUserContext) {
    return this.networkService.listFeeRules(user);
  }

  @Post('fees/rules')
  @DashboardPermission('network.fees.manage')
  upsertFeeRule(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Body() body: Record<string, unknown>,
  ) {
    return this.networkService.upsertFeeRule(user, body);
  }

  @Get('customers')
  @DashboardPermission('network.members.view')
  listCustomers(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Query('search') search?: string,
    @Query('memberOrganizationId') memberOrganizationId?: string,
  ) {
    return this.networkService.listCustomers(user, {
      search,
      memberOrganizationId,
    });
  }

  @Patch('members/:membershipId/status')
  @DashboardPermission('network.members.manage')
  updateMembershipStatus(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Param('membershipId') membershipId: string,
    @Body() body: { status: string; metadata?: Record<string, unknown> },
  ) {
    return this.networkService.updateMembershipStatus(
      user,
      membershipId,
      body.status,
      body.metadata,
    );
  }

  @Post('members/:membershipId/capabilities')
  @DashboardPermission('network.members.manage')
  setCapability(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Param('membershipId') membershipId: string,
    @Body()
    body: { capability_key: string; environment: string; status?: string },
  ) {
    return this.networkService.setCapabilityGrant(user, membershipId, body);
  }
}
