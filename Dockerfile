FROM docker.m.daocloud.io/library/node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM docker.m.daocloud.io/library/node:20-alpine AS builder

WORKDIR /app

# 构建时占位 DATABASE_URL，避免 Prisma 模块级初始化因 undefined 崩溃
# 运行时由 SAE 注入真实值，此值不进入最终镜像
ARG DATABASE_URL=mysql://build:build@localhost:3306/build
ENV DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# 构建完成后裁剪 devDeps，保留生产依赖（含 prisma CLI 及其所有传递依赖）
RUN npm prune --omit=dev

FROM docker.m.daocloud.io/library/node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# 用裁剪后的 node_modules 覆盖 standalone 的精简版
COPY --from=builder /app/node_modules ./node_modules
# 再用 builder 生成的 prisma client 覆盖（包含平台专属 query engine 二进制）
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "/app/docker-entrypoint.sh"]
