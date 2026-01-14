FROM node:22.18.0 AS dist
WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN yarn build:prod

FROM node:22.18.0 AS node_modules
WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install --prod

FROM node:22.18.0

ARG PORT=3000

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=dist /app/dist ./dist
COPY --from=node_modules /app/node_modules ./node_modules

COPY package.json yarn.lock ./

EXPOSE $PORT

CMD [ "yarn", "start:prod" ]
