/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import {
  IncludeBankAccount,
  IncludeClientPersona,
  IncludeBuyerPersona,
  IncludeFunderPersona,
  IncludeOrganizationPerson,
  IncludeSupplierPersona,
  Organization,
  UpdatableOrganization,
} from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllOrganizationDto {
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
  includeBankAccount?: IncludeBankAccount | undefined;
  includeClientPersona?: IncludeClientPersona | undefined;
  includeBuyerPersona?: IncludeBuyerPersona | undefined;
  includeSupplierPersona?: IncludeSupplierPersona | undefined;
  includeFunderPersona?: IncludeFunderPersona | undefined;
}

export interface OrganizationByIdDto {
  id: number[];
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
  includeBankAccount?: IncludeBankAccount | undefined;
  includeClientPersona?: IncludeClientPersona | undefined;
  includeBuyerPersona?: IncludeBuyerPersona | undefined;
  includeSupplierPersona?: IncludeSupplierPersona | undefined;
  includeFunderPersona?: IncludeFunderPersona | undefined;
}

export interface OrganizationByClientPersonaIdDto {
  clientPersonaId: number[];
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
  includeBankAccount?: IncludeBankAccount | undefined;
  includeBuyerPersona?: IncludeBuyerPersona | undefined;
  includeSupplierPersona?: IncludeSupplierPersona | undefined;
  includeFunderPersona?: IncludeFunderPersona | undefined;
}

export interface OrganizationByBuyerPersonaIdDto {
  buyerPersonaId: number[];
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
  includeBankAccount?: IncludeBankAccount | undefined;
  includeClientPersona?: IncludeClientPersona | undefined;
  includeSupplierPersona?: IncludeSupplierPersona | undefined;
  includeFunderPersona?: IncludeFunderPersona | undefined;
}

export interface OrganizationBySupplierPersonaIdDto {
  supplierPersonaId: number[];
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
  includeBankAccount?: IncludeBankAccount | undefined;
  includeClientPersona?: IncludeClientPersona | undefined;
  includeBuyerPersona?: IncludeBuyerPersona | undefined;
  includeFunderPersona?: IncludeFunderPersona | undefined;
}

export interface OrganizationByFunderPersonaIdDto {
  funderPersonaId: number[];
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
  includeBankAccount?: IncludeBankAccount | undefined;
  includeClientPersona?: IncludeClientPersona | undefined;
  includeBuyerPersona?: IncludeBuyerPersona | undefined;
  includeSupplierPersona?: IncludeFunderPersona | undefined;
}

export interface OrganizationByNameDto {
  name: string;
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
  includeBankAccount?: IncludeBankAccount | undefined;
  includeClientPersona?: IncludeClientPersona | undefined;
  includeBuyerPersona?: IncludeBuyerPersona | undefined;
  includeSupplierPersona?: IncludeSupplierPersona | undefined;
}

export interface CreateOrganizationDto {
  organization: UpdatableOrganization | undefined;
}

export interface UpdateOrganizationDto {
  id: number;
  organization: UpdatableOrganization | undefined;
}

export interface OrganizationList {
  organizations: Organization[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface OrganizationGrpcServiceClient {
  getAllGrpc(request: GetAllOrganizationDto): Observable<OrganizationList>;

  findByIdGrpc(request: OrganizationByIdDto): Observable<OrganizationList>;

  findByClientPersonaIdGrpc(request: OrganizationByClientPersonaIdDto): Observable<OrganizationList>;

  findByBuyerPersonaIdGrpc(request: OrganizationByBuyerPersonaIdDto): Observable<OrganizationList>;

  findBySupplierPersonaIdGrpc(request: OrganizationBySupplierPersonaIdDto): Observable<OrganizationList>;

  findByFunderPersonaIdGrpc(request: OrganizationByFunderPersonaIdDto): Observable<OrganizationList>;

  findByNameGrpc(request: OrganizationByNameDto): Observable<OrganizationList>;

  createGrpc(request: CreateOrganizationDto): Observable<Organization>;

  updateGrpc(request: UpdateOrganizationDto): Observable<Organization>;
}

export interface OrganizationGrpcServiceController {
  getAllGrpc(
    request: GetAllOrganizationDto,
  ): Promise<OrganizationList> | Observable<OrganizationList> | OrganizationList;

  findByIdGrpc(
    request: OrganizationByIdDto,
  ): Promise<OrganizationList> | Observable<OrganizationList> | OrganizationList;

  findByClientPersonaIdGrpc(
    request: OrganizationByClientPersonaIdDto,
  ): Promise<OrganizationList> | Observable<OrganizationList> | OrganizationList;

  findByBuyerPersonaIdGrpc(
    request: OrganizationByBuyerPersonaIdDto,
  ): Promise<OrganizationList> | Observable<OrganizationList> | OrganizationList;

  findBySupplierPersonaIdGrpc(
    request: OrganizationBySupplierPersonaIdDto,
  ): Promise<OrganizationList> | Observable<OrganizationList> | OrganizationList;

  findByFunderPersonaIdGrpc(
    request: OrganizationByFunderPersonaIdDto,
  ): Promise<OrganizationList> | Observable<OrganizationList> | OrganizationList;

  findByNameGrpc(
    request: OrganizationByNameDto,
  ): Promise<OrganizationList> | Observable<OrganizationList> | OrganizationList;

  createGrpc(request: CreateOrganizationDto): Promise<Organization> | Observable<Organization> | Organization;

  updateGrpc(request: UpdateOrganizationDto): Promise<Organization> | Observable<Organization> | Organization;
}

export function OrganizationGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      "getAllGrpc",
      "findByIdGrpc",
      "findByClientPersonaIdGrpc",
      "findByBuyerPersonaIdGrpc",
      "findBySupplierPersonaIdGrpc",
      "findByFunderPersonaIdGrpc",
      "findByNameGrpc",
      "createGrpc",
      "updateGrpc",
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("OrganizationGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("OrganizationGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const ORGANIZATION_GRPC_SERVICE_NAME = "OrganizationGrpcService";
