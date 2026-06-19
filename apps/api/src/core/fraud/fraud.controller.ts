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
import { FraudService } from './fraud.service';
import { UpdateFraudAlertDto, UpdateFraudRuleDto } from './dto/fraud.dto';

@ApiTags('Fraude')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller()
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('fraud-rules')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Lister les règles de fraude' })
  @ApiResponse({ status: 200, description: 'Règles de fraude' })
  async listRules(@CurrentUser() user: AuthContext) {
    return this.fraudService.listRules(user);
  }

  @Patch('fraud-rules/:ruleId')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Mettre à jour une règle de fraude' })
  @ApiParam({ name: 'ruleId', description: 'Fraud rule ID' })
  @ApiBody({ type: UpdateFraudRuleDto })
  async updateRule(
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateFraudRuleDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.fraudService.updateRule(user, ruleId, dto);
  }

  @Get('fraud-alerts')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Lister les alertes de fraude' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async listAlerts(
    @CurrentUser() user: AuthContext,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize = 50,
  ) {
    return this.fraudService.listAlerts(user, status, page, pageSize);
  }

  @Patch('fraud-alerts/:id')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Résoudre ou rejeter une alerte' })
  @ApiParam({ name: 'id', description: 'Fraud alert ID' })
  @ApiBody({ type: UpdateFraudAlertDto })
  async updateAlert(
    @Param('id') id: string,
    @Body() dto: UpdateFraudAlertDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.fraudService.updateAlert(user, id, dto);
  }
}
