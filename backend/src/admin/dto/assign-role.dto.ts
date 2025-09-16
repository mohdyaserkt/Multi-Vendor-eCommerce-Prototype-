import { IsNotEmpty, IsUUID, IsArray } from 'class-validator';

export class AssignRoleDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  roleId: string;
}