import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InternalCronGuard } from '../core/common/guards/internal-cron.guard';
import { WebhookSenderService } from './webhook-sender.service';

@ApiExcludeController()
@ApiTags('Internal')
@UseGuards(InternalCronGuard)
@Controller('internal/webhooks')
export class WebhooksInternalController {
  constructor(
    private readonly webhookSender: WebhookSenderService,
    @InjectQueue('webhooks') private readonly webhookQueue: Queue,
  ) {}

  @Post('process-outbox')
  @ApiOperation({
    summary: 'Queue BullMQ jobs for pending webhook outbox dispatches',
    description: 'Called from SQL via pg_net after outbox rows are created.',
  })
  async processOutbox(@Body() body: { outbox_id?: string }) {
    if (!body?.outbox_id) {
      return { queued: 0, error: 'outbox_id required' };
    }

    return this.webhookSender.queuePendingOutboxDispatches(
      body.outbox_id,
      this.webhookQueue,
    );
  }
}
