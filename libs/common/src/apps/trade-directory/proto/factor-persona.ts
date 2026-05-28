/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { FactorPersona, IncludeOrganization, UpdatableFactorPersona } from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllFactorPersonaDto {
  includeOrganization?: IncludeOrganization | undefined;
}

export interface FactorPersonaByIdDto {
  id: number[];
  includeOrganization?: IncludeOrganization | undefined;
}

export interface CreateFactorPersonaDto {
  organizationId: number;
  factorPersona: UpdatableFactorPersona | undefined;
}

export interface UpdateFactorPersonaDto {
  id: number;
  factorPersona: UpdatableFactorPersona | undefined;
}

export interface FactorPersonaList {
  factorPersonas: FactorPersona[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface FactorPersonaGrpcServiceClient {
  getAllGrpc(request: GetAllFactorPersonaDto): Observable<FactorPersonaList>;

  findByIdGrpc(request: FactorPersonaByIdDto): Observable<FactorPersonaList>;

  createGrpc(request: CreateFactorPersonaDto): Observable<FactorPersona>;

  updateGrpc(request: UpdateFactorPersonaDto): Observable<FactorPersona>;
}

export interface FactorPersonaGrpcServiceController {
  getAllGrpc(
    request: GetAllFactorPersonaDto,
  ): Promise<FactorPersonaList> | Observable<FactorPersonaList> | FactorPersonaList;

  findByIdGrpc(
    request: FactorPersonaByIdDto,
  ): Promise<FactorPersonaList> | Observable<FactorPersonaList> | FactorPersonaList;

  createGrpc(request: CreateFactorPersonaDto): Promise<FactorPersona> | Observable<FactorPersona> | FactorPersona;

  updateGrpc(request: UpdateFactorPersonaDto): Promise<FactorPersona> | Observable<FactorPersona> | FactorPersona;
}

export function FactorPersonaGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["getAllGrpc", "findByIdGrpc", "createGrpc", "updateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("FactorPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("FactorPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const FACTOR_PERSONA_GRPC_SERVICE_NAME = "FactorPersonaGrpcService";
