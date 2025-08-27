import { HttpException, HttpStatus } from '@nestjs/common';

export class MalformedPasswordException extends HttpException {
  constructor() {
    super('Malformed encrypted password', HttpStatus.BAD_REQUEST);
  }
}
