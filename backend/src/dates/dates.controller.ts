import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { DatesService } from "./dates.service";
import { CreateDateEntryDto, UpdateDateEntryDto } from "./dates.dto";
import { ImageUploadService } from "../utils/image-upload.service";
import { BUCKET_NAMES } from "../constants/storage.constants";
import { PAGINATION_DEFAULTS } from "../constants/app.constants";

@Controller("dates")
export class DatesController {
  constructor(
    private readonly datesService: DatesService,
    private readonly imageUploadService: ImageUploadService
  ) {}

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
  async findAll(@Query("limit") limit?: string, @Query("offset") offset?: string) {
    try {
      const limitNum = limit
        ? parseInt(limit, PAGINATION_DEFAULTS.PARSE_BASE)
        : undefined;
      const offsetNum = offset
        ? parseInt(offset, PAGINATION_DEFAULTS.PARSE_BASE)
        : undefined;
      return await this.datesService.findAll(limitNum, offsetNum);
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

  @Post("upload-image")
  async uploadImage(@Body() body: { image: string }) {
    return await this.imageUploadService.uploadImage(
      body.image,
      BUCKET_NAMES.DATES
    );
  }
}
