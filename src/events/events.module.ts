import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { ConnectorModule } from '@/connector';

@Module({
  imports: [ConfigModule, ConnectorModule],
  providers: [EventsGateway],
})
export class EventsModule {}
