import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { OwnerRequest } from '../guards/owner-session.guard.js';
import { OwnerSessionGuard } from '../guards/owner-session.guard.js';
import { HandlesService } from '../services/handles.service.js';

@Controller('v1/handles')
export class HandlesController {
  constructor(private readonly handles: HandlesService) {}

  @Post('claim')
  @UseGuards(OwnerSessionGuard)
  claim(@Req() req: OwnerRequest, @Body() body: { handle?: string }) {
    const handle = body.handle ?? '';
    const result = this.handles.claim(handle, req.ownerEmail!);
    return { ok: true, ...result };
  }

  @Get(':handle')
  resolve(@Param('handle') handle: string) {
    const result = this.handles.resolve(handle);
    return { ok: true, ...result };
  }
}
