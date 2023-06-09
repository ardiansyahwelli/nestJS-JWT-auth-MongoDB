import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Type,
  mixin,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { RMessage } from 'src/response/response.interface';
import { LoginDto } from './auth.login.dto';

export function RequestValidationPipe(schema: {
  new (...args: any[]): any;
}): Type<PipeTransform> {
  class MixinRequestValidationPipe implements PipeTransform {
    constructor(
      private readonly responseService: ResponseService,
      private readonly messageService: MessageService,
    ) {}

    async transform(
      value: Record<string, any>,
      { metatype }: ArgumentMetadata,
    ): Promise<Record<string, any>> {
      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }

      const logger = new Logger();
      const request = plainToClass(schema, value);

      logger.log('Request data', 'RequestValidationPipe');
      logger.log(request, 'RequestValidationPipe');

      const rawErrors: Record<string, any>[] = await validate(request);
      if (rawErrors.length > 0) {
        const error_message: string =
          this.messageService.getRequestErrorsMessage(rawErrors);

        logger.log('Request Error', 'RequestValidationPipe');
        logger.log(error_message, 'RequestValidationPipe');

        const errors: RMessage = {
          value: '',
          property: 'validation',
          constraint: [error_message],
        };

        throw new BadRequestException(
          this.responseService.error(
            HttpStatus.BAD_REQUEST,
            errors,
            this.messageService.get('http.clientError.badRequest'),
          ),
        );
      }
      return value;
    }

    private toValidate(metatype: Record<string, any>): boolean {
      const types: Record<string, any>[] = [LoginDto];
      return types.includes(metatype);
    }
  }

  return mixin(MixinRequestValidationPipe);
}
