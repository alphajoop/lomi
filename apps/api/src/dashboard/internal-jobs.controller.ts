import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../core/common/guards/internal-api-key.guard';
import {
  InternalJobsService,
  type EnqueueJobBody,
} from './internal-jobs.service';

@ApiExcludeController()
@ApiTags('Internal')
@UseGuards(InternalApiKeyGuard)
@Controller('internal/jobs')
export class InternalJobsController {
  constructor(private readonly internalJobsService: InternalJobsService) {}

  @Post()
  @ApiOperation({
    summary: 'Enqueue a background job for apps/worker',
    description:
      'Called from SQL via enqueue_notification or internal systems.',
  })
  enqueue(@Body() body: EnqueueJobBody) {
    return this.internalJobsService.enqueue(body);
  }
}
