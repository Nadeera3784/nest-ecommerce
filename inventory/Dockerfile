FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci  --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:22-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

RUN npm ci  --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]

