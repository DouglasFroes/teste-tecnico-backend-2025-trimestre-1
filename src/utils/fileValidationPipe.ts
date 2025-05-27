import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('No file provided');
    }
    // "max 10 mb
    const limit = 10 * 1024 * 1024; // 10 MB
    // return value.size < oneKb;

    if (value?.size > limit) {
      throw new BadRequestException(`File size exceeds the limit of 10 MB`);
    }

    if (!value.mimetype.startsWith('video/')) {
      throw new BadRequestException(
        'Invalid file type. Only video files are allowed.',
      );
    }

    console.log(`File size: ${value.size} bytes, Limit: ${limit} bytes`);

    return value;
  }
}
