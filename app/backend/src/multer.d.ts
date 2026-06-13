declare module 'multer' {
  import type { Request } from 'express';

  export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }

  export function memoryStorage(): unknown;
}
