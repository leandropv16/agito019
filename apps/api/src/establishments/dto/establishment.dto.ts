import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { DAYS_OF_WEEK, ESTABLISHMENT_STATUSES, type DayOfWeek, type EstablishmentStatus } from "../../common/shared";

export class BusinessHourDto {
  @IsEnum(DAYS_OF_WEEK)
  dayOfWeek!: DayOfWeek;

  @IsOptional()
  @IsString()
  opensAt?: string | null;

  @IsOptional()
  @IsString()
  closesAt?: string | null;

  @IsOptional()
  @IsBoolean()
  closed?: boolean;
}

export class MediaAttachDto {
  @IsUUID()
  mediaId!: string;

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;

  @IsOptional()
  sortOrder?: number;
}

export class CreateEstablishmentDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  addressStreet?: string;

  @IsOptional()
  @IsString()
  addressNumber?: string;

  @IsOptional()
  @IsString()
  addressComplement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsUUID()
  cityId!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  googleMapsUrl?: string;

  @IsOptional()
  @IsEnum(ESTABLISHMENT_STATUSES)
  status?: EstablishmentStatus;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  audienceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  amenityIds?: string[];

  @IsOptional()
  @IsBoolean()
  hasMusic?: boolean | null;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  genreIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHourDto)
  businessHours?: BusinessHourDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaAttachDto)
  media?: MediaAttachDto[];
}

export class UpdateEstablishmentDto extends CreateEstablishmentDto {
  @IsOptional()
  @IsString()
  declare name: string;

  @IsOptional()
  @IsUUID()
  declare cityId: string;

  @IsOptional()
  @IsLatitude()
  declare latitude: number;

  @IsOptional()
  @IsLongitude()
  declare longitude: number;
}
