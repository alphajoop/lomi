import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BnplService } from './bnpl.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import {
  WRITE_THROTTLE_LIMIT,
  WRITE_THROTTLE_TTL_MS,
} from '../../config/http.constants';
import {
  UpdateBnplInterestRateDto,
  UpdateBnplSettingsDto,
} from './dto/update-bnpl-settings.dto';

@ApiTags('BNPL')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('bnpl')
export class BnplController {
  constructor(private readonly bnplService: BnplService) {}

  @Get('plans')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'List BNPL installment plans for the organization' })
  listPlans(
    @CurrentUser() user: AuthContext,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.bnplService.listPlans(user, limit, offset);
  }

  @Get('config')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Get BNPL configuration summary' })
  getConfig(@CurrentUser() user: AuthContext) {
    return this.bnplService.getConfigSummary(user);
  }

  @Patch('settings')
  @ApiLomiAccountHeader()
  @Throttle({
    default: { limit: WRITE_THROTTLE_LIMIT, ttl: WRITE_THROTTLE_TTL_MS },
  })
  @ApiOperation({ summary: 'Enable or disable BNPL for the organization' })
  updateSettings(
    @CurrentUser() user: AuthContext,
    @Body() body: UpdateBnplSettingsDto,
  ) {
    return this.bnplService.toggleBnpl(user, body.enabled);
  }

  @Patch('interest-rate')
  @ApiLomiAccountHeader()
  @Throttle({
    default: { limit: WRITE_THROTTLE_LIMIT, ttl: WRITE_THROTTLE_TTL_MS },
  })
  @ApiOperation({ summary: 'Update customer BNPL interest rate (XOF)' })
  updateInterestRate(
    @CurrentUser() user: AuthContext,
    @Body() body: UpdateBnplInterestRateDto,
  ) {
    return this.bnplService.updateInterestRate(user, body.interestRate);
  }
}
