import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Custom exception for bad request errors (validation, invalid input, etc.)
 */
export class BadRequestException extends HttpException {
  constructor(message: string = "Bad request") {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: "Bad Request",
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

