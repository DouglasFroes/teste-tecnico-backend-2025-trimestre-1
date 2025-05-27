import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
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
  getFile(@Req() req: Request, @Res() res: Response): any {
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

      const fileSize = fileStats.size;
      const fileExtension = path.split('.').pop();
      const contentType = getContextTypeByExtension(String(fileExtension));
      const range = req.headers.range;

      if (!range) {
        // Sem range: retorna o arquivo completo com status 200
        res.status(200);
        res.set({
          'Content-Type': contentType,
          'Content-Length': fileSize.toString(),
        });
        const file = createReadStream(filePath);
        file.pipe(res);
        return;
      }

      // Com range: retorna fatia do arquivo com status 206
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res
          .status(416)
          .set({
            'Content-Range': `bytes */${fileSize}`,
          })
          .end();
        return;
      }

      const chunkSize = end - start + 1;
      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': contentType,
      });
      const file = createReadStream(filePath, { start: start, end: end });
      file.pipe(res);
      return;
    } catch {
      throw new NotFoundException('Arquivo não encontrado');
    }
  }
}
