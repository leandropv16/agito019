import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SeoService } from "./seo.service";

@ApiTags("Public")
@Controller("public/seo")
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get("landing")
  landing(
    @Query("city") city?: string,
    @Query("topic") topic?: string,
    @Query("when") when?: string,
    @Query("slot") slot?: string,
    @Query("slot2") slot2?: string,
  ) {
    return this.seo.landing({ city, topic, when, slot, slot2 });
  }

  @Get("sitemap")
  sitemap() {
    return this.seo.sitemap();
  }
}
