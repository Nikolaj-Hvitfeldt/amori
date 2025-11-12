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
import { MomentsService } from "./moments.service";
import { CreateMomentDto, UpdateMomentDto } from "./moments.dto";

@Controller("moments")
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @Post()
  async create(@Body() createMomentDto: CreateMomentDto) {
    try {
      return await this.momentsService.create(createMomentDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to create moment",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.momentsService.findAll();
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch moments",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    try {
      return await this.momentsService.findOne(id);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch moment",
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateMomentDto: UpdateMomentDto
  ) {
    try {
      return await this.momentsService.update(id, updateMomentDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to update moment",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    try {
      await this.momentsService.remove(id);
      return { message: "Moment deleted successfully" };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to delete moment",
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
