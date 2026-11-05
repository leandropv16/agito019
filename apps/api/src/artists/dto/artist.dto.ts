import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
import { ARTIST_STATUSES, ARTIST_TYPES, type ArtistStatus, type ArtistType } from "../../common/shared";
import { MediaAttachDto } from "../../establishments/dto/establishment.dto";

export class CreateArtistDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(ARTIST_TYPES)
  type!: ArtistType;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  hireUrl?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string | null;

  @IsOptional()
  @IsEnum(ARTIST_STATUSES)
  status?: ArtistStatus;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  genreIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaAttachDto)
  media?: MediaAttachDto[];
}

export class UpdateArtistDto extends CreateArtistDto {
  @IsOptional()
  @IsString()
  declare name: string;

  @IsOptional()
  @IsEnum(ARTIST_TYPES)
  declare type: ArtistType;
}
