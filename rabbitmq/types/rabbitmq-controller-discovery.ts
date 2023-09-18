import { PatternMetadata } from '@nestjs/microservices';
import { ControllerOptions } from '@nestjs/common';

export type RabbitMqControllerDiscovery = ControllerOptions & {
  name: string;
  methods: {
    name: string;
    pattern: PatternMetadata;
    transport?: string;
    extras?: Record<string, any>;
    params?: any[];
  }[];
};
