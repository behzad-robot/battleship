FROM node:8
# Create app directory
WORKDIR /usr/src/battleship
COPY . .
WORKDIR /usr/src/battleship/api
RUN  npm install
WORKDIR /usr/src/battleship/ws
RUN  npm install
WORKDIR /usr/src/battleship/admin
RUN  npm install
EXPOSE 4545
EXPOSE 3000
EXPOSE 80
WORKDIR /usr/src/battleship/api
RUN npm run api