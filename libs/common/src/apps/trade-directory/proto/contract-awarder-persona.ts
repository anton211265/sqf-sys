/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { ContractAwarderPersona, IncludeOrganization, UpdatableContractAwarderPersona } from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllContractAwarderPersonaDto {
  includeOrganization?: IncludeOrganization | undefined;
}

export interface ContractAwarderPersonaByIdDto {
  id: number[];
  includeOrganization?: IncludeOrganization | undefined;
}

export interface CreateContractAwarderPersonaDto {
  organizationId: number;
  contractAwarderPersona: UpdatableContractAwarderPersona | undefined;
}

export interface UpdateContractAwarderPersonaDto {
  id: number;
  contractAwarderPersona: UpdatableContractAwarderPersona | undefined;
}

export interface ContractAwarderPersonaList {
  contractAwarderPersonas: ContractAwarderPersona[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface ContractAwarderPersonaGrpcServiceClient {
  getAllGrpc(request: GetAllContractAwarderPersonaDto): Observable<ContractAwarderPersonaList>;

  findByIdGrpc(request: ContractAwarderPersonaByIdDto): Observable<ContractAwarderPersonaList>;

  createGrpc(request: CreateContractAwarderPersonaDto): Observable<ContractAwarderPersona>;

  updateGrpc(request: UpdateContractAwarderPersonaDto): Observable<ContractAwarderPersona>;
}

export interface ContractAwarderPersonaGrpcServiceController {
  getAllGrpc(
    request: GetAllContractAwarderPersonaDto,
  ): Promise<ContractAwarderPersonaList> | Observable<ContractAwarderPersonaList> | ContractAwarderPersonaList;

  findByIdGrpc(
    request: ContractAwarderPersonaByIdDto,
  ): Promise<ContractAwarderPersonaList> | Observable<ContractAwarderPersonaList> | ContractAwarderPersonaList;

  createGrpc(
    request: CreateContractAwarderPersonaDto,
  ): Promise<ContractAwarderPersona> | Observable<ContractAwarderPersona> | ContractAwarderPersona;

  updateGrpc(
    request: UpdateContractAwarderPersonaDto,
  ): Promise<ContractAwarderPersona> | Observable<ContractAwarderPersona> | ContractAwarderPersona;
}

export function ContractAwarderPersonaGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["getAllGrpc", "findByIdGrpc", "createGrpc", "updateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("ContractAwarderPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("ContractAwarderPersonaGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const CONTRACT_AWARDER_PERSONA_GRPC_SERVICE_NAME = "ContractAwarderPersonaGrpcService";
