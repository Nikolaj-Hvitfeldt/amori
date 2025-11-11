import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateJournalEntryDto, UpdateJournalEntryDto } from './journal.dto';

@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  async findAll(@Query('type') type?: string) {
    if (type) {
      return this.journalService.findByType(type);
    }
    return this.journalService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.journalService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateJournalEntryDto) {
    return this.journalService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateJournalEntryDto) {
    return this.journalService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.journalService.remove(id);
  }
}
