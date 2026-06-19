import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../core/common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../core/common/decorators/current-user.decorator';
import { CreateHandoffDto } from './dto/create-workflow.dto';
import { AgentHandoffStore } from './agent-handoff.store';
import { L5EventBusService } from './l5-event-bus.service';

@Controller('agent')
@ApiTags('Agent')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
export class AgentHandoffController {
  constructor(
    private readonly handoffs: AgentHandoffStore,
    private readonly bus: L5EventBusService,
  ) {}

  @Post('handoff')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiBody({ type: CreateHandoffDto })
  @ApiOperation({
    summary:
      'Transfert inter-services / inter-agents (contexte + enveloppe de tâche)',
  })
  @ApiResponse({ status: 201, description: 'Transfert enregistré' })
  async create(
    @CurrentUser() user: AuthContext,
    @Body() body: CreateHandoffDto,
  ) {
    const h = await this.handoffs.create(user.organizationId, {
      to: body.to,
      task: body.task,
      context: body.context,
      trace_id: body.trace_id,
    });
    this.bus.emit(user.organizationId, {
      type: 'agent.handoff',
      handoff_id: h.handoff_id,
    });
    return { data: h };
  }

  @Get('handoff/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Récupérer un enregistrement de transfert' })
  async get(@CurrentUser() user: AuthContext, @Param('id') id: string) {
    const h = await this.handoffs.get(user.organizationId, id);
    if (!h) {
      throw new NotFoundException('Handoff not found');
    }
    return { data: h };
  }
}
