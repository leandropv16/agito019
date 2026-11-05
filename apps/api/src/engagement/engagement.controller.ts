import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { EngagementService } from "./engagement.service";
import { CreateClickMetricDto, CreateEventReportDto } from "./dto/engagement.dto";

@ApiTags("Engagement")
@Controller()
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Post("public/event-reports")
  report(@Body() dto: CreateEventReportDto) {
    return this.engagement.reportEvent(dto);
  }

  @Post("public/clicks")
  click(@Body() dto: CreateClickMetricDto) {
    return this.engagement.trackClick(dto);
  }

  @Get("admin/event-reports")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listReports() {
    return this.engagement.listReports();
  }

  @Patch("admin/event-reports/:id/resolve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  resolve(@Param("id", ParseUUIDPipe) id: string) {
    return this.engagement.resolveReport(id);
  }

  @Get("admin/click-metrics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  clickSummary() {
    return this.engagement.clickSummary();
  }
}
