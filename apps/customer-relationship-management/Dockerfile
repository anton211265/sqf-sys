FROM node:18-alpine AS development

ARG PROJECT_NAME=customer-relationship-management
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.json

RUN npm ci
COPY ./apps/$PROJECT_NAME/package.json \
    ./apps/$PROJECT_NAME/package-lock.json \
    ./apps/$PROJECT_NAME/
RUN cd apps/$PROJECT_NAME && \
    npm ci

FROM node:18-alpine AS builder

ARG PROJECT_NAME=customer-relationship-management
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci
COPY ./apps/$PROJECT_NAME/package.json \
    ./apps/$PROJECT_NAME/package-lock.json \
    ./apps/$PROJECT_NAME/
RUN cd apps/$PROJECT_NAME && \
    npm ci
COPY . .
RUN npm run build --project=$PROJECT_NAME
RUN npm run script:build --project=$PROJECT_NAME
RUN npm run migration:build --project=$PROJECT_NAME

FROM node:18-alpine

ARG PROJECT_NAME=customer-relationship-management
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --production && npm cache clean --force
COPY ./apps/$PROJECT_NAME/package.json \
    ./apps/$PROJECT_NAME/package-lock.json \
    ./apps/$PROJECT_NAME/typeorm.config.js \
    ./$PROJECT_NAME/
RUN cd $PROJECT_NAME && \
    npm ci --production && npm cache clean --force
COPY --from=builder ./usr/src/app/dist/apps/$PROJECT_NAME ./$PROJECT_NAME
CMD ["node", "./customer-relationship-management/main.js"]