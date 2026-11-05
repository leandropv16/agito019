import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { PromotionsService } from "./promotions.service";
import { CreatePromotionDto, UpdatePromotionDto } from "./dto/promotion.dto";

@ApiTags("Promotions")
@Controller("admin/promotions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "PARTNER")
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.promotions.list(user, page, limit);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePromotionDto) {
    return this.promotions.create(user, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotions.update(user, id, dto);
  }
}
