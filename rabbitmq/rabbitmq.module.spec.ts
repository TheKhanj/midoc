import axios from 'axios';
import { Test } from '@nestjs/testing';
import { Controller } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  TcpOptions,
  Transport,
} from '@nestjs/microservices';

import { RabbitMqModule } from './rabbitmq.module';
import { getRandomPort, getRandomTcpConfig } from '../../testing';
import { IsNotEmpty, IsString } from 'class-validator';

describe('RabbitMqModule', () => {
  let port: number;

  class AppDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  }

  @Controller('path')
  class AppController {
    @MessagePattern('message-pattern', Transport.RMQ, { extra1: 'value1' })
    get(@Payload() payload: AppDto) {
      return 'ok';
    }
  }

  beforeAll(async () => {
    port = getRandomPort();
    const moduleRef = await Test.createTestingModule({
      imports: [
        RabbitMqModule.forRoot({
          port,
        }),
      ],
      controllers: [AppController],
    }).compile();

    const tcpConfig = getRandomTcpConfig();
    const app = moduleRef.createNestMicroservice<TcpOptions>(tcpConfig);
    await app.init();
    await app.listen();
  });

  it('server should be started at proper port', async () => {
    const promise = axios.get(`http://127.0.0.1:${port}/api-rabbit`);
    await expect(promise).resolves.toEqual(expect.anything());
    const res = await promise;
    expect(res.data).toEqual({
      rabbitMq: {
        queue: expect.any(String),
        url: expect.any(String),
      },
      controllers: [
        {
          name: 'AppController',
          path: 'path',
          methods: [
            {
              name: 'get',
              pattern: 'message-pattern',
              transport: 'RMQ',
              extras: {
                extra1: 'value1',
              },
              params: expect.anything(),
            },
          ],
        },
      ],
    });
  });
});
