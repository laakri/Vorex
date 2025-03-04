import { Controller, Get } from '@nestjs/common';
import { BatchService } from './batch.service';
import { Batch } from '@prisma/client';

@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  async getBatches(): Promise<Batch[]> {
    return this.batchService.getBatches();
  }
} 