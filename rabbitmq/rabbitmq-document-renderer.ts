import { Injectable } from '@nestjs/common';

import { RabbitMqDocumentRendererOptions } from './types/rabbitmq-document-renderer.options';

@Injectable()
export class RabbitMqDocumentRenderer {
  async render(options: RabbitMqDocumentRendererOptions): Promise<string> {
    return JSON.stringify(options, null, 2);
  }
}
