import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import { getContextTypeByExtension } from 'src/utils/contextType';

@ApiTags('Files')
@Controller('static/video')
export class FilesController {
  @ApiParam({
    name: 'filename',
    description: 'Nome do arquivo a ser buscado',
    required: true,
    type: String,
    example: 'video.mp4',
  })
  @Get('*path')
  @Header('Accept-Ranges', 'bytes')
  getFile(@Req() req: Request): StreamableFile {
    const path = req.params['path'][0] || req.params['path'];

    if (!path) {
      throw new NotFoundException('Nenhum arquivo especificado');
    }

    const filePath = join(__dirname, '..', '..', '..', 'public', path);

    try {
      const fileStats = statSync(filePath);
      if (!fileStats.isFile()) {
        throw new NotFoundException('Arquivo não encontrado');
      }

      const file = createReadStream(filePath);

      const fileExtension = path.split('.').pop();

      return new StreamableFile(file, {
        type: getContextTypeByExtension(String(fileExtension)),
      });
    } catch {
      throw new NotFoundException('Arquivo não encontrado');
    }
  }
}
