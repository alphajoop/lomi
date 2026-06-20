import {
  Controller,
  Get,
  Param,
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
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { DisputesService } from './disputes.service';

@ApiTags('Litiges')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Lister les litiges' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des litiges' })
  async findAll(
    @CurrentUser() user: AuthContext,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize = 50,
  ) {
    return this.disputesService.findAll(
      user,
      status,
      page,
      pageSize,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Obtenir un litige' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({ status: 200, description: 'Détail du litige' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.disputesService.findOne(id, user);
  }
}
