import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum DocumentType {
  GST_CERTIFICATE = 'GST_CERTIFICATE',
  PAN_CARD = 'PAN_CARD',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  ID_PROOF = 'ID_PROOF',
}

export class UploadDocumentDto {
  @IsNotEmpty()
  @IsString()
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsNotEmpty()
  @IsString()
  fileName: string;
}