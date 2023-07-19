FROM nginx

RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

RUN mkdir -p /server/dist

RUN mkdir -p /server/config

RUN mkdir -p /server/logs

WORKDIR /server

COPY ./dist/ /server/dist/


COPY ./nginx/ /server/config/

ENV DOLLER='$'


EXPOSE 9999

CMD ["/bin/bash", "-c", "envsubst < /server/config/nginx.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;' && nginx -s reload "]
