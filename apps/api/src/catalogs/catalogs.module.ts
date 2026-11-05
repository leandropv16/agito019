import { Module } from "@nestjs/common";
import { CatalogsService } from "./catalogs.service";
import { CatalogsAdminController } from "./catalogs.controller";

@Module({
  controllers: [CatalogsAdminController],
  providers: [CatalogsService],
  exports: [CatalogsService],
})
export class CatalogsModule {}
