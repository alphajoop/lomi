import { Module } from '@nestjs/common';
import { BnplController } from './bnpl.controller';
import { BnplService } from './bnpl.service';
import { SpiModule } from '../spi/spi.module';

@Module({
  imports: [SpiModule],
  controllers: [BnplController],
  providers: [BnplService],
  exports: [BnplService],
})
export class BnplModule {}
