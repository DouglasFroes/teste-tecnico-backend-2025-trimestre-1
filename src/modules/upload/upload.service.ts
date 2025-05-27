import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import { dirname, join } from 'path';
import { showLog } from 'src/utils/showLog';

@Injectable()
export class UploadService {
  async run(file: Express.Multer.File) {
    const { originalname, buffer } = file;

    const fileOrigem = join(
      __dirname,
      '..',
      '..',
      '..',
      'public',
      originalname,
    );
    const directory = dirname(fileOrigem);

    try {
      await fsPromises.mkdir(directory, { recursive: true });

      await fsPromises.writeFile(fileOrigem, buffer);

      return;
    } catch (error) {
      showLog(error);
      throw new BadRequestException('Error to save file');
    }
  }
}
