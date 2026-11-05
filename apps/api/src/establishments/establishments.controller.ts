import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { EstablishmentsService } from "./establishments.service";
import { CreateEstablishmentDto, UpdateEstablishmentDto } from "./dto/establishment.dto";

@ApiTags("Establishments")
@Controller("admin/establishments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "PARTNER")
export class EstablishmentsController {
  constructor(private readonly establishments: EstablishmentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.establishments.list(user, page, limit);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.establishments.get(user, id);
  }

  @Get(":id/users")
  listUsers(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.establishments.listUsers(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEstablishmentDto) {
    return this.establishments.create(user, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstablishmentDto,
  ) {
    return this.establishments.update(user, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.establishments.remove(user, id);
  }
}
