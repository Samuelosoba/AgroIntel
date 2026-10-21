# Build from the repo root: docker build -f server/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY shared ./shared
COPY server ./server
RUN npm ci -w server -w shared --include-workspace-root \
 && npx -w server prisma generate \
 && npm run build -w server

FROM node:22-alpine
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/server ./server
WORKDIR /repo/server
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
