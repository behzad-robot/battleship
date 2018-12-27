FROM node:8
# Create app directory
WORKDIR /usr/src/battleship
COPY . .
WORKDIR /usr/src/battleship/api
RUN npm install pm2 -g --loglevel verbose
RUN  npm install --loglevel verbose
WORKDIR /usr/src/battleship/ws
RUN  npm install --loglevel verbose
WORKDIR /usr/src/battleship/admin
RUN  npm install --loglevel verbose
EXPOSE 4545
EXPOSE 4444
EXPOSE 4040
WORKDIR /usr/src/battleship/
RUN chmod u+x ./linux_deploy.sh
#RUN npm run api
CMD [ "sh","./linux_deploy.sh"]