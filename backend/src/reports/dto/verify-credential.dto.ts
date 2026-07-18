import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyCredentialDto {
  @IsString()
  @IsNotEmpty()
  credentialKey: string;
}
