import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseSessionGuard } from '../core/common/guards/supabase-session.guard';
import { OrganizationContextGuard } from '../core/common/guards/organization-context.guard';
import {
  CurrentDashboardUser,
  type DashboardUserContext,
} from './decorators/dashboard-user.decorator';
import { DashboardMeService } from './dashboard-me.service';

@ApiExcludeController()
@ApiTags('Dashboard')
@Controller('dashboard/v1')
export class DashboardMeController {
  constructor(private readonly meService: DashboardMeService) {}

  @Get('health')
  @ApiOperation({ summary: 'Dashboard API health' })
  health() {
    return this.meService.health();
  }

  @Get('me')
  @UseGuards(SupabaseSessionGuard)
  @ApiOperation({ summary: 'Current merchant session' })
  me(@Req() req: { merchantId: string; supabaseUserEmail?: string }) {
    return this.meService.getMe({
      merchantId: req.merchantId,
      email: req.supabaseUserEmail,
    });
  }

  @Get('organizations/:organizationId/me')
  @UseGuards(SupabaseSessionGuard, OrganizationContextGuard)
  @ApiOperation({ summary: 'Current merchant session scoped to organization' })
  meForOrg(@CurrentDashboardUser() user: DashboardUserContext) {
    return this.meService.getMe(user);
  }
}
