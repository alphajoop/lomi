import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { MetersService } from './meters.service';
import { CreateMeterDto } from './dto/create-meter.dto';
import { UpdateMeterDto } from './dto/update-meter.dto';
import {
  MeterBalanceResponseDto,
  MeterResponseDto,
} from './dto/meter-response.dto';

@ApiTags('Meters')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('meters')
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a meter',
    description:
      'Defines a billable metric for usage-based products. Events with matching code update meter balances.',
  })
  @ApiResponse({ status: 201, type: MeterResponseDto })
  create(@Body() dto: CreateMeterDto, @CurrentUser() user: AuthContext) {
    return this.metersService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List meters' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: MeterResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('productId') productId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active =
      isActive === undefined
        ? undefined
        : isActive === 'true' || isActive === '1';
    return this.metersService.findAll(user, productId, active);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a meter' })
  @ApiParam({ name: 'id', description: 'Meter ID' })
  @ApiResponse({ status: 200, type: MeterResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMeterDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.metersService.update(id, dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a meter' })
  @ApiParam({ name: 'id', description: 'Meter ID' })
  @ApiResponse({ status: 200, type: MeterResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.metersService.findOne(id, user);
  }

  @Get(':id/balances/:customerId')
  @ApiOperation({
    summary: 'Get meter balance for a customer',
    description:
      'Returns aggregated consumed units for the meter and customer.',
  })
  @ApiResponse({ status: 200, type: MeterBalanceResponseDto })
  getBalance(
    @Param('id') id: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.metersService.getBalance(id, customerId, user);
  }
}
