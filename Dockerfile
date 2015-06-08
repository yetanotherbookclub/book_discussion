FROM iojs:onbuild

ADD . /app
WORKDIR /app

RUN npm install

EXPOSE 5000
CMD ["iojs", "app.js"]
