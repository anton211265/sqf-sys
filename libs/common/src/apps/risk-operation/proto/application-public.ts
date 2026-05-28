/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "risk_operation";

export interface ValidateDto {
  applicationPublicUuid: string;
}

export interface ValidateResponse {
  applicationPublicId: number;
  applicationId: number;
  clientPersonaId: number;
}

export const RISK_OPERATION_PACKAGE_NAME = "risk_operation";

export interface ApplicationPublicGrpcServiceClient {
  validateGrpc(request: ValidateDto): Observable<ValidateResponse>;
}

export interface ApplicationPublicGrpcServiceController {
  validateGrpc(request: ValidateDto): Promise<ValidateResponse> | Observable<ValidateResponse> | ValidateResponse;
}

export function ApplicationPublicGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["validateGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("ApplicationPublicGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("ApplicationPublicGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const APPLICATION_PUBLIC_GRPC_SERVICE_NAME = "ApplicationPublicGrpcService";
