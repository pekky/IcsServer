FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src

RUN mkdir -p /app/data

ENV PORT=3000
ENV BASE_URL=http://localhost:3000
ENV DATABASE_PATH=/app/data/events.db

EXPOSE 3000

CMD ["node", "src/index.js"]
