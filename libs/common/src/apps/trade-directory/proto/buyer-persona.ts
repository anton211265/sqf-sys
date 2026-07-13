/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { BuyerPersona, IncludeOrganization, UpdatableBuyerPersona } from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllBuyerPersonaDto {
  includeOrganization?: IncludeOrganization | undefined;
}

export interface BuyerPersonaByIdDto {
  id: number[];
  includeOrganization?: IncludeOrganization | undefined;
}

export interface CreateBuyerPersonaDto {
  organizationId: number;
  buyerPersona: UpdatableBuyerPersona | undefined;
}

export interface UpdateBuyerPersonaDto {
  id: number;
  buyerPersona: UpdatableBuyerPersona | undefined;
}

export interface BuyerPersonaList {
  buyerPersonas: BuyerPersona[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface BuyerPersonaGrpcServiceClient {
  getAllGrpc(request: GetAllBuyerPersonaDto): Observable<BuyerPersonaList>;

  findByIdGrpc(request: BuyerPersonaByIdDto): Observable<BuyerPersonaList>;

  createGrpc(request: CreateBuyerPersonaDto): Observable<BuyerPersona>;

  updateGrpc(request: UpdateBuyerPersonaDto): Observable<BuyerPersona>;
}

export interface BuyerPersonaGrpcServiceController {
  getAllGrpc(
    request: GetAllBuyerPersonaDto,
  ): Promise<BuyerPersonaList> | Observable<BuyerPersonaList> | BuyerPersonaList;

  findByIdGrpc(
    request: BuyerPersonaByIdDto,
  ): Promise<BuyerPersonaList> | Observable<BuyerPersonaList> | BuyerPersonaList;

  createGrpc(
    request: CreateBuyerPersonaDto,
  ): Promise<BuyerPersona> | Observable<BuyerPersona> | BuyerPersona;

  updateGrpc(
    request: UpdateBuyerPersonaDto,
  ): Promise<BuyerPersona> | Observable<BuyerPersona> | BuyerPersona;
}

export function BuyerPersonaGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["getAllGrpc", "findByIdGrpc", "createGrpc", "updateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("BuyerPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("BuyerPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const BUYER_PERSONA_GRPC_SERVICE_NAME = "BuyerPersonaGrpcService";
