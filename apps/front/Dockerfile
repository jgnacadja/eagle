FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app


FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages packages
COPY apps/front apps/front
RUN pnpm install --filter @learnup/front... --frozen-lockfile
RUN pnpm --filter @learnup/front build

FROM base AS runtime
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
WORKDIR /app

COPY --from=build /app/apps/front/.output ./.output

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
