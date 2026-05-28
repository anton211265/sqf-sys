/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { Empty } from "../../google/protobuf/empty";

export const protobufPackage = "notification";

export interface SendEmailDto {
  emailSender: string;
  emailReceivers: string[];
  emailCc: string[];
  emailBcc: string[];
  emailReplyTo: string[];
  emailSubject?: string | undefined;
  emailTemplate?: SendEmailTemplateDto | undefined;
  emailBody?: string | undefined;
}

export interface SendEmailTemplateDto {
  templateName: string;
  templateVariables: { [key: string]: string };
}

export interface SendEmailTemplateDto_TemplateVariablesEntry {
  key: string;
  value: string;
}

export const NOTIFICATION_PACKAGE_NAME = "notification";

export interface EmailGrpcServiceClient {
  sendEmailGrpc(request: SendEmailDto): Observable<Empty>;
}

export interface EmailGrpcServiceController {
  sendEmailGrpc(request: SendEmailDto): void;
}

export function EmailGrpcServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["sendEmailGrpc"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("EmailGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("EmailGrpcService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const EMAIL_GRPC_SERVICE_NAME = "EmailGrpcService";
