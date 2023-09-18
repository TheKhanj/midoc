import { NestFactory } from '@nestjs/core';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { Inject, Logger, Module, OnModuleInit } from '@nestjs/common';

import { RabbitMqModuleOptions } from './types/rabbitmq-module.options';
import { RabbitMqDiscoveryService } from './rabbitmq-discovery.service';
import { RabbitMqDocumentRenderer } from './rabbitmq-document-renderer';
import { RabbitMqDocumentController } from './rabbitmq-document-controller';

const logger = new Logger('RabbitDoc');

@Module({
  controllers: [RabbitMqDocumentController],
  imports: [DiscoveryModule],
  providers: [
    RabbitMqDiscoveryService,
    RabbitMqDocumentRenderer,
    {
      provide: 'OPTIONS',
      useValue: {},
    },
  ],
})
export class RabbitMqModule implements OnModuleInit {
  private serverStarted = false;

  constructor(
    @Inject('OPTIONS')
    private readonly options: RabbitMqModuleOptions,
    private readonly rmqDiscovery: RabbitMqDiscoveryService,
    private readonly renderer: RabbitMqDocumentRenderer,
  ) {}

  static forRoot(options?: RabbitMqModuleOptions) {
    return {
      module: RabbitMqModule,
      providers: [
        {
          provide: 'OPTIONS',
          useValue: options,
        },
      ],
    };
  }

  onModuleInit() {
    if (
      this.options &&
      typeof this.options?.port === 'number' &&
      this.serverStarted === false
    ) {
      this.serverStarted = true;
      this.startServer()
        .then(() => logger.warn('Rabbitmq documentation service stopped'))
        .catch(() => logger.error('Rabbitmq documentation service stopped'));
    }
  }

  async startServer() {
    @Module({
      controllers: [RabbitMqDocumentController],
      providers: [
        {
          provide: RabbitMqDocumentRenderer,
          useValue: this.renderer,
        },
        {
          provide: RabbitMqDiscoveryService,
          useValue: this.rmqDiscovery,
        },
      ],
    })
    class AppModule {}

    const app = await NestFactory.create(AppModule);
    const port = this.options?.port as number;

    logger.log(`Rabbitmq documentation listening on port ${port}`, 'RabbitDoc');
    await app.listen(port);
  }
}
