import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { RadarService } from './radar.service';
import { UpdateRadarSettingsDto } from './dto/radar.dto';

@ApiTags('Radar')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller()
export class RadarController {
  constructor(private readonly radarService: RadarService) {}

  @Get('risk-assessments')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'List payment risk assessments' })
  @ApiQuery({ name: 'decision', required: false, enum: ['allow', 'flag', 'block'] })
  @ApiQuery({ name: 'rail', required: false, enum: ['card', 'mtn', 'wave'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Risk assessments' })
  async listAssessments(
    @CurrentUser() user: AuthContext,
    @Query('decision') decision?: string,
    @Query('rail') rail?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize = 50,
  ) {
    return this.radarService.listAssessments(
      user,
      decision,
      rail,
      page,
      pageSize,
      startDate,
      endDate,
    );
  }

  @Get('risk-assessments/:id')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Get a risk assessment' })
  @ApiParam({ name: 'id', description: 'Risk assessment ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.radarService.findOne(id, user);
  }

  @Get('organization/radar-settings')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Get Radar settings for the organization' })
  async getSettings(@CurrentUser() user: AuthContext) {
    return this.radarService.getSettings(user);
  }

  @Patch('organization/radar-settings')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Update Radar settings' })
  @ApiBody({ type: UpdateRadarSettingsDto })
  async updateSettings(
    @CurrentUser() user: AuthContext,
    @Body() dto: UpdateRadarSettingsDto,
  ) {
    return this.radarService.updateSettings(user, dto);
  }
}
