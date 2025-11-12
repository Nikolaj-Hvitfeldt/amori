import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { DatesService } from "./dates.service";
import { CreateDateEntryDto, UpdateDateEntryDto } from "./dates.dto";

@Controller("dates")
export class DatesController {
  constructor(private readonly datesService: DatesService) {}

  @Post()
  async create(@Body() createDateEntryDto: CreateDateEntryDto) {
    try {
      return await this.datesService.create(createDateEntryDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to create date entry",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.datesService.findAll();
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch date entries",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    try {
      return await this.datesService.findOne(id);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch date entry",
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDateEntryDto: UpdateDateEntryDto
  ) {
    try {
      return await this.datesService.update(id, updateDateEntryDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to update date entry",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    try {
      await this.datesService.remove(id);
      return { message: "Date entry deleted successfully" };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to delete date entry",
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
