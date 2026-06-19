import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiKeyGuard } from '../core/common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../core/common/decorators/current-user.decorator';
import { CliTriggerService } from './cli-trigger.service';

class CliTriggerBodyDto {
  @IsString()
  @IsIn([
    'PAYMENT_CREATED',
    'PAYMENT_SUCCEEDED',
    'PAYMENT_FAILED',
    'REFUND_CREATED',
    'REFUND_COMPLETED',
    'REFUND_FAILED',
    'SUBSCRIPTION_CREATED',
    'SUBSCRIPTION_UPDATED',
    'SUBSCRIPTION_RENEWED',
    'SUBSCRIPTION_CANCELLED',
  ])
  event!: string;

  @IsOptional()
  @IsString()
  webhook_id?: string;
}

@ApiTags('CLI')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('cli')
export class CliTriggerController {
  constructor(private readonly triggerService: CliTriggerService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Émettre un événement webhook synthétique (sandbox)',
    description:
      'Envoie un payload de test aux webhooks abonnés et au flux `lomi listen`.',
  })
  @ApiBody({ type: CliTriggerBodyDto })
  trigger(@CurrentUser() user: AuthContext, @Body() body: CliTriggerBodyDto) {
    return this.triggerService.trigger(user, body.event, body.webhook_id);
  }
}
