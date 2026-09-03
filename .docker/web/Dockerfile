FROM node:24-alpine

WORKDIR /app

COPY web/package*.json ./
RUN npm install

COPY web/ .

EXPOSE 3000

CMD ["npm", "run", "dev"]
