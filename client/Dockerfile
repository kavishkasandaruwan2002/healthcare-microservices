# Build stage
FROM node:20-bookworm AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM node:20-bookworm
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
