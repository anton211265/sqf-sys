/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { IncludeOrganization, IncludePerson, OrganizationPerson, UpdatableOrganizationPerson } from "./entity";

export const protobufPackage = "trade_directory";

export interface OrganizationPersonByOrganizationIdDto {
  organizationId: number;
  includeOrganization?: IncludeOrganization | undefined;
  includePerson?: IncludePerson | undefined;
}

export interface CreateOrganizationPersonDto {
  organizationId: number;
  personId: number;
  organizationPerson: UpdatableOrganizationPerson | undefined;
}

export interface UpdateOrganizationPersonDto {
  id: number;
  organizationPerson: UpdatableOrganizationPerson | undefined;
}

export interface OrganizationPersonList {
  organizationPersons: OrganizationPerson[];
}

export const TRADE_DIRECTORY_PACKAGE_NAME = "trade_directory";

export interface OrganizationPersonGrpcServiceClient {
  findByOrganizationIdGrpc(request: OrganizationPersonByOrganizationIdDto): Observable<OrganizationPersonList>;

  createGrpc(request: CreateOrganizationPersonDto): Observable<OrganizationPerson>;

  updateGrpc(request: UpdateOrganizationPersonDto): Observable<OrganizationPerson>;
}

export interface OrganizationPersonGrpcServiceController {
  findByOrganizationIdGrpc(
    request: OrganizationPersonByOrganizationIdDto,
  ): Promise<OrganizationPersonList> | Observable<OrganizationPersonList> | OrganizationPersonList;

  createGrpc(
    request: CreateOrganizationPersonDto,
  ): Promise<OrganizationPerson> | Observable<OrganizationPerson> | OrganizationPerson;

  updateGrpc(
    request: UpdateOrganizationPersonDto,
  ): Promise<OrganizationPerson> | Observable<OrganizationPerson> | OrganizationPerson;
}

export function OrganizationPersonGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["findByOrganizationIdGrpc", "createGrpc", "updateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("OrganizationPersonGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("OrganizationPersonGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const ORGANIZATION_PERSON_GRPC_SERVICE_NAME = "OrganizationPersonGrpcService";
