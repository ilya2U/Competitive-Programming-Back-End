import { Module } from '@nestjs/common';
import { ConnectorService } from './connector.service';

@Module({
  imports: [],
  providers: [ConnectorService],
  exports: [ConnectorService],
})
export class ConnectorModule {}
