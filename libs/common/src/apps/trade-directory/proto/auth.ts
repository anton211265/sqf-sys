/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { OrganizationPersonRoleEnum } from "./entity";

export const protobufPackage = "trade_directory";

export interface AuthenticateDto {
  token: string;
}

export interface AuthenticateResponse {
  personId: number;
  name: string;
  preferredUsername: string;
  identificationNumber: string;
  mobileNumber: string;
  email: string;
  sub: string;
  organizationPersonId: number;
  organizationPersonRoles: AuthOrganizationPersonRole[];
  organizationId: number;
  clientPersonaId?: number | undefined;
  contractAwarderPersonaId?: number | undefined;
  supplierPersonaId?: number | undefined;
  factorPersonaId?: number | undefined;
}

export interface AuthOrganizationPersonRole {
  role: OrganizationPersonRoleEnum;
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface AuthGrpcServiceClient {
  authenticateGrpc(request: AuthenticateDto): Observable<AuthenticateResponse>;
}

export interface AuthGrpcServiceController {
  authenticateGrpc(
    request: AuthenticateDto,
  ): Promise<AuthenticateResponse> | Observable<AuthenticateResponse> | AuthenticateResponse;
}

export function AuthGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["authenticateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("AuthGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("AuthGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const AUTH_GRPC_SERVICE_NAME = "AuthGrpcService";
