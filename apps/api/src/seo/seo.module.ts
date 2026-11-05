import { Global, Module } from "@nestjs/common";
import { DiscoveryModule } from "../discovery/discovery.module";
import { SeoController } from "./seo.controller";
import { SeoRevalidateService } from "./seo-revalidate.service";
import { SeoService } from "./seo.service";

@Global()
@Module({
  imports: [DiscoveryModule],
  controllers: [SeoController],
  providers: [SeoService, SeoRevalidateService],
  exports: [SeoService, SeoRevalidateService],
})
export class SeoModule {}
