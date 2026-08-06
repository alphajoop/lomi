import {
  Controller,
  Get,
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
import { BnplService } from './bnpl.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';

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
}
