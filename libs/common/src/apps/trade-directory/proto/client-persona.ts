/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { ClientPersona, IncludeOrganization, UpdatableClientPersona } from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllClientPersonaDto {
  includeOrganization?: IncludeOrganization | undefined;
}

export interface ClientPersonaByIdDto {
  id: number[];
  includeOrganization?: IncludeOrganization | undefined;
}

export interface CreateClientPersonaDto {
  organizationId: number;
  clientPersona: UpdatableClientPersona | undefined;
}

export interface UpdateClientPersonaDto {
  id: number;
  clientPersona: UpdatableClientPersona | undefined;
}

export interface ClientPersonaList {
  clientPersonas: ClientPersona[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface ClientPersonaGrpcServiceClient {
  getAllGrpc(request: GetAllClientPersonaDto): Observable<ClientPersonaList>;

  findByIdGrpc(request: ClientPersonaByIdDto): Observable<ClientPersonaList>;

  createGrpc(request: CreateClientPersonaDto): Observable<ClientPersona>;

  updateGrpc(request: UpdateClientPersonaDto): Observable<ClientPersona>;
}

export interface ClientPersonaGrpcServiceController {
  getAllGrpc(
    request: GetAllClientPersonaDto,
  ): Promise<ClientPersonaList> | Observable<ClientPersonaList> | ClientPersonaList;

  findByIdGrpc(
    request: ClientPersonaByIdDto,
  ): Promise<ClientPersonaList> | Observable<ClientPersonaList> | ClientPersonaList;

  createGrpc(request: CreateClientPersonaDto): Promise<ClientPersona> | Observable<ClientPersona> | ClientPersona;

  updateGrpc(request: UpdateClientPersonaDto): Promise<ClientPersona> | Observable<ClientPersona> | ClientPersona;
}

export function ClientPersonaGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["getAllGrpc", "findByIdGrpc", "createGrpc", "updateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("ClientPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("ClientPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const CLIENT_PERSONA_GRPC_SERVICE_NAME = "ClientPersonaGrpcService";
