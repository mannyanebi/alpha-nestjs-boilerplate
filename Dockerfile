# Stage 1: Build the application
FROM node:22.18.0-alpine AS build
WORKDIR /app

# Copy Yarn configuration and release
COPY .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy dependency files
COPY package.json yarn.lock ./

# Install all dependencies (needed for build)
RUN yarn install --immutable

# Copy source and config files
COPY tsconfig.json tsconfig.build.json nest-cli.json .swcrc ./
COPY src ./src

# Build the application
RUN yarn build:prod

# Stage 2: Install production dependencies only
FROM node:22.18.0-alpine AS prod_dependencies
WORKDIR /app

# Copy Yarn configuration and release
COPY .yarnrc.yml ./
COPY .yarn ./.yarn

COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn workspaces focus --production

# Stage 3: Run the application
FROM node:22.18.0-alpine AS production

# Set the environment to production
ENV NODE_ENV=production

# Railway automatically provides the PORT variable
ENV PORT=3000

# Create and switch to a non-root user for security
RUN addgroup -g 1001 -S appuser && \
  adduser -S appuser -u 1001
USER appuser

WORKDIR /app

# Copy built application and production dependencies
COPY --from=prod_dependencies --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appuser /app/dist ./dist
COPY --chown=appuser:appuser package.json yarn.lock ./

# Expose port (Railway will override with $PORT)
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"]
