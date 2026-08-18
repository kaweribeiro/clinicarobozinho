FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npm run build
# aplica as migrações do banco e só então sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
