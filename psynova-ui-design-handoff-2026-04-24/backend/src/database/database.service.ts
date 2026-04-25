import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private enabled = false;
  private pool: Pool | null = null;

  async onModuleInit(): Promise<void> {
    await ConfigModule.envVariablesLoaded;
    this.enabled = process.env.USE_PERSISTENCE === 'true';
    if (!this.enabled) {
      return;
    }
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'psynova',
      user: process.env.DB_USER || 'psynova',
      password: process.env.DB_PASSWORD || 'psynova_password_change_me',
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database persistence is disabled');
    }
    return this.pool.query<T>(sql, params);
  }

  async ping(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.warn(`Database ping failed: ${(error as Error).message}`);
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
