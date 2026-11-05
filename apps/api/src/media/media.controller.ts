import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { MediaService } from "./media.service";
import { AppException } from "../common/errors/app.exception";
import { HttpStatus } from "@nestjs/common";
import { memoryStorage } from "multer";

class UploadMetaDto {
  @IsOptional()
  @IsString()
  altText?: string;
}

@ApiTags("Media")
@Controller("admin/media")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE ?? 5_242_880) },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Body() body: UploadMetaDto) {
    if (!file) {
      throw new AppException("FILE_REQUIRED", "Envie um arquivo de imagem", HttpStatus.BAD_REQUEST);
    }
    return this.media.upload(file, body.altText);
  }
}
