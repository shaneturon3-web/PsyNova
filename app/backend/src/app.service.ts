import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { name: string; status: string; tag: string } {
    return {
      name: 'PsyNova Virtual Clinic API',
      status: 'ok',
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }
}
