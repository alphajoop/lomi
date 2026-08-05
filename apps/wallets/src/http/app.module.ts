import { Module } from '@nestjs/common';
import { DatabaseService } from '../db/database.service.js';
import { OwnerSessionGuard } from '../guards/owner-session.guard.js';
import { AccountWalletsService } from '../services/account-wallets.service.js';
import { HandlesService } from '../services/handles.service.js';
import { OwnerSessionService } from '../services/owner-session.service.js';
import { PayService } from '../services/pay.service.js';
import { VirtualWalletsService } from '../services/virtual-wallets.service.js';
import { AccountWalletsController } from './account-wallets.controller.js';
import { HandlesController } from './handles.controller.js';
import { HealthController } from './health.controller.js';
import { PayController } from './pay.controller.js';
import { SessionsController } from './sessions.controller.js';
import { VirtualWalletsController } from './virtual-wallets.controller.js';

@Module({
  controllers: [
    HealthController,
    SessionsController,
    HandlesController,
    AccountWalletsController,
    VirtualWalletsController,
    PayController,
  ],
  providers: [
    DatabaseService,
    OwnerSessionService,
    OwnerSessionGuard,
    HandlesService,
    AccountWalletsService,
    VirtualWalletsService,
    PayService,
  ],
})
export class AppModule {}
