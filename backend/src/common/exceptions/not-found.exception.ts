import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Custom exception for resource not found errors
 */
export class NotFoundException extends HttpException {
  constructor(message: string = "Resource not found") {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: "Not Found",
      },
      HttpStatus.NOT_FOUND
    );
  }
}

