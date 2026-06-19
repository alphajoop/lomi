import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import {
  CreateWorkflowDto,
  UpdateWorkflowStepDto,
} from './dto/create-workflow.dto';
import { AgentWorkflowsStore } from './agent-workflows.store';
import { L5EventBusService } from './l5-event-bus.service';

@Controller('agent')
@ApiTags('Agent')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
export class AgentWorkflowsController {
  constructor(
    private readonly workflows: AgentWorkflowsStore,
    private readonly bus: L5EventBusService,
  ) {}

  @Post('workflows')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary:
      "Démarrer un workflow multi-étapes (idempotence sur idempotency_key, persistant)",
  })
  @ApiResponse({ status: 201, description: 'Exécution créée' })
  @ApiBody({ type: CreateWorkflowDto })
  async create(
    @CurrentUser() user: AuthContext,
    @Body() body: CreateWorkflowDto,
  ) {
    const run = await this.workflows.create(user.organizationId, {
      name: body.name,
      steps: body.steps,
      idempotency_key: body.idempotency_key,
    });
    this.bus.emit(user.organizationId, {
      type: 'agent.workflow_created',
      run_id: run.run_id,
    });
    return { data: run };
  }

  @Get('workflows/:runId')
  @ApiParam({ name: 'runId' })
  @ApiOperation({ summary: "Obtenir l'état d'une exécution de workflow" })
  async get(@CurrentUser() user: AuthContext, @Param('runId') runId: string) {
    return { data: await this.workflows.get(user.organizationId, runId) };
  }

  @Patch('workflows/:runId/steps/:stepId')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiParam({ name: 'runId' })
  @ApiParam({ name: 'stepId' })
  @ApiBody({ type: UpdateWorkflowStepDto })
  @ApiOperation({
    summary: "Faire avancer une étape du workflow (primitive d'orchestration)",
  })
  @ApiResponse({ status: 200, description: 'Mis à jour' })
  async patchStep(
    @CurrentUser() user: AuthContext,
    @Param('runId') runId: string,
    @Param('stepId') stepId: string,
    @Body() body: UpdateWorkflowStepDto,
  ) {
    const run = await this.workflows.updateStep(
      user.organizationId,
      runId,
      stepId,
      body.status,
    );
    this.bus.emit(user.organizationId, {
      type: 'agent.workflow_step',
      run_id: run.run_id,
      step_id: stepId,
      status: body.status,
    });
    return { data: run };
  }
}
