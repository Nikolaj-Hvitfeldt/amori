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
import { MilestonesService } from "./milestones.service";
import { CreateMilestoneDto, UpdateMilestoneDto } from "./milestones.dto";
import { ImageUploadService } from "../utils/image-upload.service";
import { BUCKET_NAMES } from "../constants/storage.constants";
import { PAGINATION_DEFAULTS } from "../constants/app.constants";

@Controller("milestones")
export class MilestonesController {
  constructor(
    private readonly milestonesService: MilestonesService,
    private readonly imageUploadService: ImageUploadService
  ) {}

  @Post()
  async create(@Body() createMilestoneDto: CreateMilestoneDto) {
    try {
      return await this.milestonesService.create(createMilestoneDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to create milestone",
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
      return await this.milestonesService.findAll(limitNum, offsetNum);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch milestones",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    try {
      return await this.milestonesService.findOne(id);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch milestone",
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto
  ) {
    try {
      return await this.milestonesService.update(id, updateMilestoneDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to update milestone",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    try {
      await this.milestonesService.remove(id);
      return { message: "Milestone deleted successfully" };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to delete milestone",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post("upload-image")
  async uploadImage(@Body() body: { image: string }) {
    return await this.imageUploadService.uploadImage(
      body.image,
      BUCKET_NAMES.MILESTONES
    );
  }
}

