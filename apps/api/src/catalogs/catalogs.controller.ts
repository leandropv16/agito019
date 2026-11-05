import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CatalogsService } from "./catalogs.service";
import { CreateCatalogDto, UpdateCatalogDto } from "./dto/catalog.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class CatalogsAdminController {
  constructor(private readonly catalogs: CatalogsService) {}

  @ApiTags("Cities")
  @Get("cities")
  cities() {
    return this.catalogs.list("city");
  }

  @ApiTags("Cities")
  @Post("cities")
  createCity(@Body() dto: CreateCatalogDto) {
    return this.catalogs.create("city", dto);
  }

  @ApiTags("Cities")
  @Patch("cities/:id")
  updateCity(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogDto) {
    return this.catalogs.update("city", id, dto);
  }

  @ApiTags("Categories")
  @Get("categories")
  categories() {
    return this.catalogs.list("category");
  }

  @ApiTags("Categories")
  @Post("categories")
  createCategory(@Body() dto: CreateCatalogDto) {
    return this.catalogs.create("category", dto);
  }

  @ApiTags("Categories")
  @Patch("categories/:id")
  updateCategory(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogDto) {
    return this.catalogs.update("category", id, dto);
  }

  @ApiTags("Audiences")
  @Get("audiences")
  audiences() {
    return this.catalogs.list("audience");
  }

  @ApiTags("Audiences")
  @Post("audiences")
  createAudience(@Body() dto: CreateCatalogDto) {
    return this.catalogs.create("audience", dto);
  }

  @ApiTags("Audiences")
  @Patch("audiences/:id")
  updateAudience(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogDto) {
    return this.catalogs.update("audience", id, dto);
  }

  @ApiTags("Amenities")
  @Get("amenities")
  amenities() {
    return this.catalogs.list("amenity");
  }

  @ApiTags("Amenities")
  @Post("amenities")
  createAmenity(@Body() dto: CreateCatalogDto) {
    return this.catalogs.create("amenity", dto);
  }

  @ApiTags("Amenities")
  @Patch("amenities/:id")
  updateAmenity(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogDto) {
    return this.catalogs.update("amenity", id, dto);
  }

  @ApiTags("Genres")
  @Get("genres")
  genres() {
    return this.catalogs.list("musicGenre");
  }

  @ApiTags("Genres")
  @Post("genres")
  createGenre(@Body() dto: CreateCatalogDto) {
    return this.catalogs.create("musicGenre", dto);
  }

  @ApiTags("Genres")
  @Patch("genres/:id")
  updateGenre(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogDto) {
    return this.catalogs.update("musicGenre", id, dto);
  }
}
