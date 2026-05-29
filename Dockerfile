FROM docker.1ms.run/node:20.14.0-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM docker.1ms.run/node:20.14.0-alpine AS app

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

COPY --from=build /app/.env.example ./.env.example

EXPOSE 3001

CMD ["npm", "run", "start"]
