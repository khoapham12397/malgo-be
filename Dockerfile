FROM node:16-alpine as builder
WORKDIR /app
COPY . .
RUN npm install 
RUN npm run build 

FROM node:16-alpine as final
WORKDIR /app
COPY --from=builder ./app/dist ./dist
COPY package.json .
COPY package-lock.json .
COPY ./images ./images
COPY ./testcases ./testcases
COPY .env .
COPY ./prisma ./prisma
RUN npm install
RUN npx prisma generate
EXPOSE 8080
CMD ["npm","start"]
