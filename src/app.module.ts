import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { UrlModule } from './modules/url/url.module';
import { UidModule } from './services/uid/uid.module';

@Module({
  imports: [CoreModule, UrlModule, UidModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
