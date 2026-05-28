/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { BankAccount, IncludeOrganization, IncludePerson, UpdatableBankAccount } from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllBankAccountDto {
  includeOrganization?: IncludeOrganization | undefined;
  includePerson?: IncludePerson | undefined;
}

export interface BankAccountByIdDto {
  id: number[];
  includeOrganization?: IncludeOrganization | undefined;
  includePerson?: IncludePerson | undefined;
}

export interface BankAccountByOrganizationIdDto {
  organizationId: number;
}

export interface CreateBankAccountDto {
  organizationId?: number | undefined;
  personId?: number | undefined;
  bankAccount: UpdatableBankAccount | undefined;
}

export interface UpdateBankAccountDto {
  id: number;
  bankAccount: UpdatableBankAccount | undefined;
}

export interface BankAccountList {
  bankAccounts: BankAccount[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface BankAccountGrpcServiceClient {
  getAllGrpc(request: GetAllBankAccountDto): Observable<BankAccountList>;

  findByIdGrpc(request: BankAccountByIdDto): Observable<BankAccountList>;

  findByOrganizationIdGrpc(request: BankAccountByOrganizationIdDto): Observable<BankAccountList>;

  createGrpc(request: CreateBankAccountDto): Observable<BankAccount>;

  updateGrpc(request: UpdateBankAccountDto): Observable<BankAccount>;
}

export interface BankAccountGrpcServiceController {
  getAllGrpc(request: GetAllBankAccountDto): Promise<BankAccountList> | Observable<BankAccountList> | BankAccountList;

  findByIdGrpc(request: BankAccountByIdDto): Promise<BankAccountList> | Observable<BankAccountList> | BankAccountList;

  findByOrganizationIdGrpc(
    request: BankAccountByOrganizationIdDto,
  ): Promise<BankAccountList> | Observable<BankAccountList> | BankAccountList;

  createGrpc(request: CreateBankAccountDto): Promise<BankAccount> | Observable<BankAccount> | BankAccount;

  updateGrpc(request: UpdateBankAccountDto): Promise<BankAccount> | Observable<BankAccount> | BankAccount;
}

export function BankAccountGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      "getAllGrpc",
      "findByIdGrpc",
      "findByOrganizationIdGrpc",
      "createGrpc",
      "updateGrpc",
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("BankAccountGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("BankAccountGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const BANK_ACCOUNT_GRPC_SERVICE_NAME = "BankAccountGrpcService";
