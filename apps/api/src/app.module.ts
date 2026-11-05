import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CatalogsModule } from "./catalogs/catalogs.module";
import { EstablishmentsModule } from "./establishments/establishments.module";
import { ArtistsModule } from "./artists/artists.module";
import { EventsModule } from "./events/events.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { MediaModule } from "./media/media.module";
import { StorageModule } from "./storage/storage.module";
import { CommercialModule } from "./commercial/commercial.module";
import { DiscoveryModule } from "./discovery/discovery.module";
import { SeoModule } from "./seo/seo.module";
import { CommonModule } from "./common/common.module";
import { EngagementModule } from "./engagement/engagement.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    PrismaModule,
    CommonModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CatalogsModule,
    EstablishmentsModule,
    ArtistsModule,
    EventsModule,
    PromotionsModule,
    MediaModule,
    CommercialModule,
    DiscoveryModule,
    SeoModule,
    EngagementModule,
  ],
})
export class AppModule {}

