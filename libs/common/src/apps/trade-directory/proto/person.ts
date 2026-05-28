/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { IncludeOrganizationPerson, Person, UpdatablePerson } from "./entity";

export const protobufPackage = "trade_directory";

export interface GetAllPersonDto {
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
}

export interface PersonByIdDto {
  id: number[];
  includeOrganizationPerson?: IncludeOrganizationPerson | undefined;
}

export interface CreatePersonDto {
  person: UpdatablePerson | undefined;
}

export interface UpdatePersonDto {
  id: number;
  person: UpdatablePerson | undefined;
}

export interface PersonList {
  persons: Person[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface PersonGrpcServiceClient {
  getAllGrpc(request: GetAllPersonDto): Observable<PersonList>;

  findByIdGrpc(request: PersonByIdDto): Observable<PersonList>;

  createGrpc(request: CreatePersonDto): Observable<Person>;

  updateGrpc(request: UpdatePersonDto): Observable<Person>;
}

export interface PersonGrpcServiceController {
  getAllGrpc(request: GetAllPersonDto): Promise<PersonList> | Observable<PersonList> | PersonList;

  findByIdGrpc(request: PersonByIdDto): Promise<PersonList> | Observable<PersonList> | PersonList;

  createGrpc(request: CreatePersonDto): Promise<Person> | Observable<Person> | Person;

  updateGrpc(request: UpdatePersonDto): Promise<Person> | Observable<Person> | Person;
}

export function PersonGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["getAllGrpc", "findByIdGrpc", "createGrpc", "updateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("PersonGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("PersonGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const PERSON_GRPC_SERVICE_NAME = "PersonGrpcService";
