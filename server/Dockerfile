FROM node:lts as builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM node:lts-slim
ENV NODE_ENV production
USER node
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder ./app/dist ./dist


CMD [ "node", "dist/index.js" ]