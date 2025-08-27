import { Module } from '@nestjs/common';

import { EncryptionService } from './services';

@Module({
  exports: [EncryptionService],
  imports: [
  ],
  providers: [
    EncryptionService,
  ],
})
export class EncryptionModule { }
