import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Custom exception for internal server errors
 */
export class InternalServerErrorException extends HttpException {
  constructor(message: string = "Internal server error") {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: "Internal Server Error",
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

