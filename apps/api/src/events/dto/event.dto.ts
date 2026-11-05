import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import {
  AGENDA_STATUSES,
  ENTRY_PRICE_TYPES,
  EVENT_STATUSES,
  EVENT_TYPES,
  type AgendaStatus,
  type EntryPriceType,
  type EventStatus,
  type EventType,
} from "../../common/shared";
import { MediaAttachDto } from "../../establishments/dto/establishment.dto";

export class EventArtistDto {
  @IsUUID()
  artistId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  establishmentId!: string;

  @IsEnum(EVENT_TYPES)
  eventType!: EventType;

  @IsDateString()
  startAt!: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsEnum(EVENT_STATUSES)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(AGENDA_STATUSES)
  agendaStatus?: AgendaStatus;

  @IsOptional()
  @IsEnum(ENTRY_PRICE_TYPES)
  entryPriceType?: EntryPriceType | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  entryPriceCents?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventArtistDto)
  artists?: EventArtistDto[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  genreIds?: string[];

  @IsOptional()
  @IsBoolean()
  hasMusic?: boolean | null;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  audienceIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaAttachDto)
  media?: MediaAttachDto[];
}

export class UpdateEventDto extends CreateEventDto {
  @IsOptional()
  @IsString()
  declare title: string;

  @IsOptional()
  @IsUUID()
  declare establishmentId: string;

  @IsOptional()
  @IsEnum(EVENT_TYPES)
  declare eventType: EventType;

  @IsOptional()
  @IsDateString()
  declare startAt: string;
}
