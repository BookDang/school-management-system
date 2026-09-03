FROM node:24-alpine

WORKDIR /app

COPY api/package*.json ./
RUN npm install

COPY api/ .

EXPOSE 4000

CMD ["npm", "run", "start:dev"]
