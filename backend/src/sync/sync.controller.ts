import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { SyncService } from "./sync.service";

@Controller("sync")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get("last-updated")
  async getLastUpdated() {
    try {
      return await this.syncService.getLastUpdatedTimestamps();
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to fetch last updated timestamps",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

