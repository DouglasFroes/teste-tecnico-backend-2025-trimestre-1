import {
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from 'src/utils/fileValidationPipe';
import { UploadService } from './upload.service';

@ApiTags('Files')
@Controller('upload/video')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(204)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload a video file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The video file to upload',
        },
      },
    },
  })
  run(@UploadedFile(new FileValidationPipe()) file: Express.Multer.File) {
    return this.uploadService.run(file);
  }
}
