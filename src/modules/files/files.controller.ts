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
import redis from 'src/utils/redis';
import { Readable } from 'stream';

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
  async getFile(@Req() req: Request, @Res() res: Response): Promise<any> {
    const path = req.params['path'][0] || req.params['path'];

    if (!path) {
      throw new NotFoundException('Nenhum arquivo especificado');
    }

    const filePath = join(__dirname, '..', '..', '..', 'public', path);
    const cacheKey = `video:${path}`;
    const range = req.headers.range;

    // Tenta buscar do cache
    let cachedBuffer: Buffer | null = null;
    try {
      const cached = await redis.getBuffer(cacheKey);
      if (cached) {
        cachedBuffer = Buffer.from(cached);
        res.setHeader('X-Cache', 'HIT');
      }
    } catch (e) {
      console.log('Erro ao acessar o cache Redis:', e);
    }

    try {
      let fileStats;
      if (!cachedBuffer) {
        fileStats = statSync(filePath);
        if (!fileStats.isFile()) {
          throw new NotFoundException('Arquivo não encontrado');
        }
      }
      const fileSize = cachedBuffer ? cachedBuffer.length : fileStats.size;
      const fileExtension = path.split('.').pop();
      const contentType = getContextTypeByExtension(String(fileExtension));

      if (!range) {
        // Sem range: retorna o arquivo completo com status 200
        res.status(200);
        res.set({
          'Content-Type': contentType,
          'Content-Length': fileSize.toString(),
        });
        if (cachedBuffer) {
          Readable.from(cachedBuffer).pipe(res);
        } else {
          const file = createReadStream(filePath);
          file.pipe(res);
          // Salva no cache para próximas requisições
          file.on('data', async (chunk) => {
            // Acumula e salva no cache ao final
            if (!res.locals._cacheBuffer) res.locals._cacheBuffer = [];
            res.locals._cacheBuffer.push(chunk);
          });
          file.on('end', async () => {
            if (res.locals._cacheBuffer) {
              const buffer = Buffer.concat(res.locals._cacheBuffer);
              await redis.set(cacheKey, buffer, 'EX', 60);
            }
          });
        }
        return;
      }

      // Com range: retorna fatia do arquivo com status 206
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`,
        }).end();
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
      if (cachedBuffer) {
        Readable.from(cachedBuffer.slice(start, end + 1)).pipe(res);
      } else {
        const file = createReadStream(filePath, { start: start, end: end });
        file.pipe(res);
        // Salva no cache para próximas requisições (apenas se range for o arquivo todo)
        if (start === 0 && end === fileSize - 1) {
          file.on('data', async (chunk) => {
            if (!res.locals._cacheBuffer) res.locals._cacheBuffer = [];
            res.locals._cacheBuffer.push(chunk);
          });
          file.on('end', async () => {
            if (res.locals._cacheBuffer) {
              const buffer = Buffer.concat(res.locals._cacheBuffer);
              await redis.set(cacheKey, buffer, 'EX', 60);
            }
          });
        }
      }
      return;
    } catch {
      throw new NotFoundException('Arquivo não encontrado');
    }
  }
}
