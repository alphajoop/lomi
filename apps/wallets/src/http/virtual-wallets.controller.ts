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
import { VirtualWalletsService } from '../services/virtual-wallets.service.js';

@Controller('v1/virtual-wallets')
export class VirtualWalletsController {
  constructor(private readonly virtualWallets: VirtualWalletsService) {}

  @Post()
  @UseGuards(OwnerSessionGuard)
  create(
    @Req() req: OwnerRequest,
    @Body()
    body: {
      account_wallet_id?: string;
      agent_slug?: string;
      period_allowance?: number;
      max_transaction?: number;
      allowlist?: string[];
    },
  ) {
    const result = this.virtualWallets.create({
      account_wallet_id: body.account_wallet_id ?? '',
      owner_email: req.ownerEmail!,
      agent_slug: body.agent_slug ?? '',
      period_allowance: body.period_allowance ?? 0,
      max_transaction: body.max_transaction ?? 0,
      allowlist: body.allowlist,
    });
    return { ok: true, virtual_wallet: result };
  }

  @Get(':id')
  @UseGuards(OwnerSessionGuard)
  get(@Req() req: OwnerRequest, @Param('id') id: string) {
    const wallet = this.virtualWallets.getByIdForOwner(id, req.ownerEmail!);
    return { ok: true, virtual_wallet: wallet };
  }
}
