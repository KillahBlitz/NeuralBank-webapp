FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=3005
ENV NITRO_PORT=3005

EXPOSE 3005

CMD ["node", ".output/server/index.mjs"]
