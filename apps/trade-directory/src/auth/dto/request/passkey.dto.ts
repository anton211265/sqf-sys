import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';

export class PasskeyRegisterOptionsDto {
  // Enrollment mode (first passkey, no session). When absent, the request
  // must carry a Bearer token instead (add-device mode).
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enrollmentToken?: string;
}

export class PasskeyRegisterVerifyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  registrationSessionId: string;

  // WebAuthn RegistrationResponseJSON — verified cryptographically server-side
  @ApiProperty()
  @IsObject()
  response: RegistrationResponseJSON;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}

export class PasskeyLoginOptionsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNumber()
  orgId: number;
}

export class PasskeyLoginVerifyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  loginSessionId: string;

  @ApiProperty()
  @IsObject()
  response: AuthenticationResponseJSON;
}

export class RenamePasskeyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  label: string;
}

export class IssueEnrollmentTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;
}

export class QrAuthorizeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  qrSessionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  pin: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reauthSessionId: string;

  @ApiProperty()
  @IsObject()
  response: AuthenticationResponseJSON;
}

export class QrCompleteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  qrSessionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  authCode: string;
}

/** Passkey e-signature (Customer Portal pass 2): a fresh assertion bound
 * to the exact document hash being signed. */
export class EsignVerifyDto {
  @IsString()
  reauthSessionId: string;

  @IsObject()
  response: Record<string, unknown>;

  @IsString()
  @Length(64, 64)
  docSha256: string;
}
