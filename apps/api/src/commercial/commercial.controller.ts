import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { CommercialService } from "./commercial.service";
import { CreateCampaignDto, UpdateCampaignDto, UpsertPlanDto } from "./dto/commercial.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommercialController {
  constructor(private readonly commercial: CommercialService) {}

  @ApiTags("Dashboard")
  @Get("dashboard")
  @Roles("ADMIN", "PARTNER")
  dashboard(@CurrentUser() user: AuthUser) {
    return this.commercial.dashboard(user);
  }

  @ApiTags("Commercial")
  @Get("commercial-plans")
  @Roles("ADMIN")
  plans() {
    return this.commercial.listPlans();
  }

  @ApiTags("Commercial")
  @Post("commercial-plans")
  @Roles("ADMIN")
  createPlan(@Body() dto: UpsertPlanDto) {
    return this.commercial.createPlan(dto);
  }

  @ApiTags("Commercial")
  @Patch("commercial-plans/:id")
  @Roles("ADMIN")
  updatePlan(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpsertPlanDto) {
    return this.commercial.updatePlan(id, dto);
  }

  @ApiTags("Commercial")
  @Get("commercial-campaigns")
  @Roles("ADMIN")
  campaigns() {
    return this.commercial.listCampaigns();
  }

  @ApiTags("Commercial")
  @Post("commercial-campaigns")
  @Roles("ADMIN")
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.commercial.createCampaign(dto);
  }

  @ApiTags("Commercial")
  @Patch("commercial-campaigns/:id")
  @Roles("ADMIN")
  updateCampaign(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCampaignDto) {
    return this.commercial.updateCampaign(id, dto);
  }
}
