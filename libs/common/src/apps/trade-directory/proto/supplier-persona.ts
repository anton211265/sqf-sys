/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { IncludeOrganization, SupplierPersona, UpdatableSupplierPersona } from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllSupplierPersonaDto {
  includeOrganization?: IncludeOrganization | undefined;
}

export interface SupplierPersonaByIdDto {
  id: number[];
  includeOrganization?: IncludeOrganization | undefined;
}

export interface CreateSupplierPersonaDto {
  organizationId: number;
  supplierPersona: UpdatableSupplierPersona | undefined;
}

export interface UpdateSupplierPersonaDto {
  id: number;
  supplierPersona: UpdatableSupplierPersona | undefined;
}

export interface SupplierPersonaList {
  supplierPersonas: SupplierPersona[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface SupplierPersonaGrpcServiceClient {
  getAllGrpc(request: GetAllSupplierPersonaDto): Observable<SupplierPersonaList>;

  findByIdGrpc(request: SupplierPersonaByIdDto): Observable<SupplierPersonaList>;

  createGrpc(request: CreateSupplierPersonaDto): Observable<SupplierPersona>;

  updateGrpc(request: UpdateSupplierPersonaDto): Observable<SupplierPersona>;
}

export interface SupplierPersonaGrpcServiceController {
  getAllGrpc(
    request: GetAllSupplierPersonaDto,
  ): Promise<SupplierPersonaList> | Observable<SupplierPersonaList> | SupplierPersonaList;

  findByIdGrpc(
    request: SupplierPersonaByIdDto,
  ): Promise<SupplierPersonaList> | Observable<SupplierPersonaList> | SupplierPersonaList;

  createGrpc(
    request: CreateSupplierPersonaDto,
  ): Promise<SupplierPersona> | Observable<SupplierPersona> | SupplierPersona;

  updateGrpc(
    request: UpdateSupplierPersonaDto,
  ): Promise<SupplierPersona> | Observable<SupplierPersona> | SupplierPersona;
}

export function SupplierPersonaGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["getAllGrpc", "findByIdGrpc", "createGrpc", "updateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("SupplierPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("SupplierPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const SUPPLIER_PERSONA_GRPC_SERVICE_NAME = "SupplierPersonaGrpcService";
