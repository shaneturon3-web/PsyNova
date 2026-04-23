import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getStatus() {
    const dbConnected = await this.databaseService.ping();
    return {
      service: 'backend',
      status: 'healthy',
      persistence: this.databaseService.isEnabled() ? 'enabled' : 'disabled',
      database: dbConnected ? 'connected' : 'not-connected',
      timestamp: new Date().toISOString(),
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }
}
