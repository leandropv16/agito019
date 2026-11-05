import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { ArtistsService } from "./artists.service";
import { CreateArtistDto, UpdateArtistDto } from "./dto/artist.dto";

@ApiTags("Artists")
@Controller("admin/artists")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "PARTNER")
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.artists.list(user, page, limit);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.artists.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateArtistDto) {
    return this.artists.create(user, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateArtistDto) {
    return this.artists.update(user, id, dto);
  }
}
