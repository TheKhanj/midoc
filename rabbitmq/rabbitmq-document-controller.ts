import { Response } from 'express';
import { Controller, Get, Res } from '@nestjs/common';

import { RabbitMqDiscoveryService } from './rabbitmq-discovery.service';
import { RabbitMqDocumentRenderer } from './rabbitmq-document-renderer';

@Controller('api-rabbit')
export class RabbitMqDocumentController {
  constructor(
    private readonly renderer: RabbitMqDocumentRenderer,
    private readonly discovery: RabbitMqDiscoveryService,
  ) {}

  @Get()
  async get(@Res() res: Response) {
    const rabbitMq = await this.discovery.getRabbitMqConfig();
    const controllers = await this.discovery.getControllers();

    const obj = {
      rabbitMq,
      controllers,
    };

    res.setHeader('Content-type', 'application/json').send(obj);
  }
}
