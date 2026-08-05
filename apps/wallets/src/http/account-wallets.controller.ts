import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import type { OwnerRequest } from '../guards/owner-session.guard.js';
import { OwnerSessionGuard } from '../guards/owner-session.guard.js';
import { AccountWalletsService } from '../services/account-wallets.service.js';

@Controller('v1/account-wallets')
export class AccountWalletsController {
  constructor(private readonly accountWallets: AccountWalletsService) {}

  @Post()
  @UseGuards(OwnerSessionGuard)
  create(@Req() req: OwnerRequest) {
    const wallet = this.accountWallets.create(req.ownerEmail!);
    return { ok: true, account_wallet: wallet };
  }

  @Get(':id')
  @UseGuards(OwnerSessionGuard)
  get(@Req() req: OwnerRequest, @Param('id') id: string) {
    const wallet = this.accountWallets.getById(id, req.ownerEmail!);
    return { ok: true, account_wallet: wallet };
  }

  @Post(':id/fund')
  @UseGuards(OwnerSessionGuard)
  fund(
    @Req() req: OwnerRequest,
    @Param('id') id: string,
    @Body() body: { amount?: number },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const amount = body.amount ?? 0;
    const result = this.accountWallets.fund(
      id,
      req.ownerEmail!,
      amount,
      idempotencyKey,
    );
    return { ok: true, ...result };
  }
}
