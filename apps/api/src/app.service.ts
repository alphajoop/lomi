import { Injectable } from '@nestjs/common';
import { getBrandText } from './utils/console-brand';

@Injectable()
export class AppService {
  getHello(): string {
    return getBrandText();
  }
}
