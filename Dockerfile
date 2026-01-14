FROM node:22.18.0 AS dist
WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install

COPY . ./

RUN yarn build:prod

FROM node:22.18.0 AS node_modules
WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install --prod

FROM node:22.18.0

ARG PORT=3000

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY --from=dist /app/dist /usr/src/app/dist
COPY --from=node_modules /app/node_modules /usr/src/app/node_modules

COPY . /usr/src/app

EXPOSE $PORT

CMD [ "yarn", "start:prod" ]
