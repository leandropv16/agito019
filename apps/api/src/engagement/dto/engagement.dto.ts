import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import {
  CLICK_ENTITY_TYPES,
  CLICK_TARGETS,
  REPORT_PROBLEM_TYPES,
  type ClickEntityType,
  type ClickTarget,
  type ReportProblemType,
} from "../../common/shared";

export class CreateEventReportDto {
  @IsUUID()
  eventId!: string;

  @IsEnum(REPORT_PROBLEM_TYPES)
  problemType!: ReportProblemType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class CreateClickMetricDto {
  @IsEnum(CLICK_TARGETS)
  target!: ClickTarget;

  @IsEnum(CLICK_ENTITY_TYPES)
  entityType!: ClickEntityType;

  @IsUUID()
  entityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  path?: string;
}
