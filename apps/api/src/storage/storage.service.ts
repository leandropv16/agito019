export type StoredImage = {
  path: string;
  thumbnailPath: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
};

export abstract class StorageService {
  abstract saveImage(buffer: Buffer, originalName: string): Promise<StoredImage>;
  abstract delete(path: string): Promise<void>;
}
