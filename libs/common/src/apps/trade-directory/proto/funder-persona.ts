/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { FunderPersona, IncludeOrganization, UpdatableFunderPersona } from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllFunderPersonaDto {
  includeOrganization?: IncludeOrganization | undefined;
}

export interface FunderPersonaByIdDto {
  id: number[];
  includeOrganization?: IncludeOrganization | undefined;
}

export interface CreateFunderPersonaDto {
  organizationId: number;
  funderPersona: UpdatableFunderPersona | undefined;
}

export interface UpdateFunderPersonaDto {
  id: number;
  funderPersona: UpdatableFunderPersona | undefined;
}

export interface FunderPersonaList {
  funderPersonas: FunderPersona[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface FunderPersonaGrpcServiceClient {
  getAllGrpc(request: GetAllFunderPersonaDto): Observable<FunderPersonaList>;

  findByIdGrpc(request: FunderPersonaByIdDto): Observable<FunderPersonaList>;

  createGrpc(request: CreateFunderPersonaDto): Observable<FunderPersona>;

  updateGrpc(request: UpdateFunderPersonaDto): Observable<FunderPersona>;
}

export interface FunderPersonaGrpcServiceController {
  getAllGrpc(
    request: GetAllFunderPersonaDto,
  ): Promise<FunderPersonaList> | Observable<FunderPersonaList> | FunderPersonaList;

  findByIdGrpc(
    request: FunderPersonaByIdDto,
  ): Promise<FunderPersonaList> | Observable<FunderPersonaList> | FunderPersonaList;

  createGrpc(request: CreateFunderPersonaDto): Promise<FunderPersona> | Observable<FunderPersona> | FunderPersona;

  updateGrpc(request: UpdateFunderPersonaDto): Promise<FunderPersona> | Observable<FunderPersona> | FunderPersona;
}

export function FunderPersonaGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["getAllGrpc", "findByIdGrpc", "createGrpc", "updateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("FunderPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("FunderPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const FUNDER_PERSONA_GRPC_SERVICE_NAME = "FunderPersonaGrpcService";
