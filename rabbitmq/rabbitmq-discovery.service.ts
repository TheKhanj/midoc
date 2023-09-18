import { Injectable } from '@nestjs/common';
import {
  HOST_METADATA,
  PATH_METADATA,
  SCOPE_OPTIONS_METADATA,
} from '@nestjs/common/constants';
import { PatternMetadata, Transport } from '@nestjs/microservices';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import {
  PARAM_ARGS_METADATA,
  PATTERN_EXTRAS_METADATA,
  PATTERN_METADATA,
  TRANSPORT_METADATA,
} from '@nestjs/microservices/constants';

import { getEnv } from '../../utils';
import { RabbitMqControllerDiscovery } from './types/rabbitmq-controller-discovery';
import { RabbitMqDocumentRendererOptions } from './types/rabbitmq-document-renderer.options';
import { targetConstructorToSchema } from 'class-validator-jsonschema';

@Injectable()
export class RabbitMqDiscoveryService {
  constructor(private readonly discovery: DiscoveryService) {}

  async getRabbitMqConfig(): Promise<
    RabbitMqDocumentRendererOptions['rabbitMq']
  > {
    return {
      queue: getEnv('RABBITMQ_QUEUE', { defaultValue: 'UNKNOWN_QUEUE' }),
      url: getEnv('RABBITMQ_URL', { defaultValue: 'UNKNOWN_URL' }),
    };
  }

  async getControllers() {
    const methods = await this.discovery.controllerMethodsWithMetaAtKey<
      PatternMetadata
    >(PATTERN_METADATA);
    const res: {
      [key: string]: RabbitMqControllerDiscovery;
    } = {};

    methods.forEach((m) => {
      const ctrlClass = m.discoveredMethod.parentClass;
      const ActualControllerClass = ctrlClass.dependencyType;
      const path = Reflect.getMetadata(PATH_METADATA, ActualControllerClass);
      const host = Reflect.getMetadata(HOST_METADATA, ActualControllerClass);
      const scope = Reflect.getMetadata(
        SCOPE_OPTIONS_METADATA,
        ActualControllerClass,
      );

      if (!res[ctrlClass.name]) {
        res[ctrlClass.name] = {
          name: ctrlClass.name,
          path,
          host,
          scope,
          methods: [],
        };
      }

      const controller = res[ctrlClass.name];
      const handler = m.discoveredMethod.handler;
      const transport = Reflect.getMetadata(
        TRANSPORT_METADATA,
        handler,
      ) as Transport;
      const extras = Reflect.getMetadata(PATTERN_EXTRAS_METADATA, handler);
      const methodParams = Reflect.getMetadata(
        'design:paramtypes',
        ActualControllerClass.prototype,
        handler.name,
      );
      const paramsMetadata = Reflect.getMetadata(
        PARAM_ARGS_METADATA,
        ActualControllerClass,
        handler.name,
      ) as {
        [key: string]: {
          index: number;
        };
      };
      const params = Object.values(paramsMetadata)
        .map(({ index }) => methodParams[index])
        .map((param) => targetConstructorToSchema(param));

      controller.methods.push({
        name: handler.name,
        pattern: m.meta[0],
        transport: Transport[transport],
        extras,
        params,
      });
    });

    return Object.keys(res).reduce((ret, key) => {
      ret.push(res[key]);
      return ret;
    }, [] as RabbitMqControllerDiscovery[]);
  }
}
