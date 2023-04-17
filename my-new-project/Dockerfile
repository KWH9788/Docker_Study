FROM node:18.13.0-alpine

WORKDIR /usr/scp/app
COPY package*.json ./
RUN npm install --only=production
COPY ./ ./
CMD npm start