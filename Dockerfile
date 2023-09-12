FROM node:alpine
# PHP extensions
RUN apk add nginx
RUN npm install pm2 -g

# COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
COPY ./nginx-conf/default.conf /etc/nginx/http.d/default.conf
COPY ./nginx-conf/nginx.conf /etc/nginx/nginx.conf
# conly activate these for AWS ECS/ECR


#CMD  /code/run-server.sh
