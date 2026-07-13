FROM node:18-bookworm-slim AS development

ARG PROJECT_NAME=document-management
WORKDIR /usr/src/app

# markitdown (Word/Excel/PowerPoint -> Markdown conversion) needs Python; its
# magika dependency pulls in onnxruntime, which has no Alpine/musl wheel, hence
# bookworm-slim (glibc) instead of node:18-alpine for this service.
# Installed at a fixed /opt path (not under WORKDIR) so MARKITDOWN_BIN_PATH is
# the same regardless of which Dockerfile stage/target actually runs.
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-venv procps && \
    rm -rf /var/lib/apt/lists/* && \
    python3 -m venv /opt/markitdown-venv && \
    /opt/markitdown-venv/bin/pip install --no-cache-dir 'markitdown[docx,xlsx,pptx,pdf]'

COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.json

RUN npm ci --legacy-peer-deps
COPY ./apps/$PROJECT_NAME/package.json \
    ./apps/$PROJECT_NAME/package-lock.json \
    ./apps/$PROJECT_NAME/
RUN cd apps/$PROJECT_NAME && \
    npm ci --legacy-peer-deps

FROM node:18-alpine AS builder

ARG PROJECT_NAME=document-management
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY ./apps/$PROJECT_NAME/package.json \
    ./apps/$PROJECT_NAME/package-lock.json \
    ./apps/$PROJECT_NAME/
RUN cd apps/$PROJECT_NAME && \
    npm ci --legacy-peer-deps
COPY . .
RUN npm run build --project=$PROJECT_NAME
RUN npm run script:build --project=$PROJECT_NAME
# RUN npm run migration:build --project=$PROJECT_NAME

FROM node:18-bookworm-slim

ARG PROJECT_NAME=document-management
WORKDIR /usr/src/app

# See development stage above for why bookworm-slim + /opt/markitdown-venv.
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-venv procps && \
    rm -rf /var/lib/apt/lists/* && \
    python3 -m venv /opt/markitdown-venv && \
    /opt/markitdown-venv/bin/pip install --no-cache-dir 'markitdown[docx,xlsx,pptx,pdf]' && \
    chown -R node:node /opt/markitdown-venv

COPY package.json package-lock.json ./
RUN npm ci --production --legacy-peer-deps && npm cache clean --force
COPY ./apps/$PROJECT_NAME/package.json \
    ./apps/$PROJECT_NAME/package-lock.json \
    # ./apps/$PROJECT_NAME/typeorm.config.js \
    ./$PROJECT_NAME/
RUN cd $PROJECT_NAME && \
    npm ci --production --legacy-peer-deps && npm cache clean --force
COPY --from=builder ./usr/src/app/dist/apps/$PROJECT_NAME ./$PROJECT_NAME

USER node
CMD ["node", "./document-management/main.js"]