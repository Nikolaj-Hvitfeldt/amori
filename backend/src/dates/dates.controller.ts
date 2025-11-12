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
import { SupabaseService } from "../supabase/supabase.service";

@Controller("dates")
export class DatesController {
  constructor(
    private readonly datesService: DatesService,
    private readonly supabase: SupabaseService
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

  @Post("upload-image")
  async uploadImage(@Body() body: { image: string }) {
    try {
      const { image } = body;
      if (!image) {
        throw new HttpException("Image is required", HttpStatus.BAD_REQUEST);
      }

      // Extract base64 data and mime type
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new HttpException("Invalid image format", HttpStatus.BAD_REQUEST);
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Determine file extension
      const extension = mimeType.split("/")[1] || "jpg";
      const fileName = `date-photos/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Upload to Supabase Storage
      const supabase = this.supabase.getClient();
      const { data, error } = await supabase.storage
        .from("date-photos")
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error("Supabase storage error:", error);
        throw new HttpException(
          `Failed to upload image: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("date-photos").getPublicUrl(fileName);

      return { url: publicUrl };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || "Failed to upload image",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
