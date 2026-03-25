# Stage 1: Build Angular app
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build Angular production files
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Angular SPA: fallback to index.html so deep links (e.g. /owner) work on hard reload
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx html folder
COPY --from=build /app/dist/angular-docker-kubernetes /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]