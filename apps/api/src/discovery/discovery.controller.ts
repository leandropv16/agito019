import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CatalogsService } from "../catalogs/catalogs.service";
import { DiscoveryService } from "./discovery.service";

@ApiTags("Public")
@Controller("public")
export class DiscoveryController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly catalogs: CatalogsService,
  ) {}

  @Get("home")
  home(@Query("date") date?: string, @Query("city") city?: string) {
    return this.discovery.home(date, city);
  }

  @Get("cities")
  cities() {
    return this.catalogs.list("city", true);
  }

  @Get("categories")
  categories() {
    return this.catalogs.list("category", true);
  }

  @Get("audiences")
  audiences() {
    return this.catalogs.list("audience", true);
  }

  @Get("genres")
  genres() {
    return this.catalogs.list("musicGenre", true);
  }

  @Get("amenities")
  amenities() {
    return this.catalogs.list("amenity", true);
  }

  @Get("procurar")
  procurar(
    @Query("city") city?: string,
    @Query("tipo") tipo?: string,
    @Query("musica") musica?: string,
    @Query("genero") genero?: string,
    @Query("clima") clima?: string,
    @Query("quando") quando?: string,
    @Query("semana") semana?: string,
    @Query("cidade") cidade?: string,
    @Query("bares") bares?: string,
    @Query("restaurantes") restaurantes?: string,
    @Query("baladas") baladas?: string,
    @Query("musicos") musicos?: string,
    @Query("eventos") eventos?: string,
  ) {
    return this.discovery.procurar({
      city,
      tipo,
      musica,
      genero,
      clima,
      quando,
      semana,
      cidade,
      bares,
      restaurantes,
      baladas,
      musicos,
      eventos,
    });
  }

  @Get("establishments")
  establishments(
    @Query("search") search?: string,
    @Query("city") city?: string,
    @Query("date") date?: string,
    @Query("category") category?: string,
    @Query("audience") audience?: string,
    @Query("genre") genre?: string,
    @Query("liveMusic") liveMusic?: string,
    @Query("promotion") promotion?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.discovery.establishments(
      {
        search,
        city,
        date,
        category,
        audience,
        genre,
        liveMusic: liveMusic === "true",
        promotion: promotion === "true",
      },
      page,
      limit,
    );
  }

  @Get("establishments/:slug")
  establishment(@Param("slug") slug: string) {
    return this.discovery.establishmentBySlug(slug);
  }

  @Get("events")
  events(
    @Query("city") city?: string,
    @Query("date") date?: string,
    @Query("type") type?: string,
    @Query("genre") genre?: string,
    @Query("artist") artist?: string,
    @Query("establishment") establishment?: string,
    @Query("liveMusic") liveMusic?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.discovery.events(
      { city, date, type, genre, artist, establishment, liveMusic: liveMusic === "true" },
      page,
      limit,
    );
  }

  @Get("events/:slug")
  event(@Param("slug") slug: string) {
    return this.discovery.eventBySlug(slug);
  }

  @Get("artists")
  artists(@Query("page") page?: number, @Query("limit") limit?: number, @Query("city") city?: string) {
    return this.discovery.artists(page, limit, city);
  }

  @Get("artists/:slug")
  artist(@Param("slug") slug: string) {
    return this.discovery.artistBySlug(slug);
  }

  @Get("promotions")
  promotions(@Query("city") city?: string) {
    return this.discovery.promotions(city);
  }
}
