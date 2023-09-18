import { RabbitMqControllerDiscovery } from './rabbitmq-controller-discovery';

export type RabbitMqDocumentRendererOptions = {
  rabbitMq: {
    url: string;
    queue: string;
  };
  controllers: RabbitMqControllerDiscovery[];
};
