import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [UploadModule, FilesModule],
})
export class ModulesModule {}
