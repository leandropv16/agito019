import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { MediaAttachDto } from "../../establishments/dto/establishment.dto";

export class CreatePromotionDto {
  @IsUUID()
  establishmentId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaAttachDto)
  media?: MediaAttachDto[];
}

export class UpdatePromotionDto extends CreatePromotionDto {
  @IsOptional()
  @IsUUID()
  declare establishmentId: string;

  @IsOptional()
  @IsString()
  declare title: string;

  @IsOptional()
  @IsDateString()
  declare startsAt: string;

  @IsOptional()
  @IsDateString()
  declare endsAt: string;
}
