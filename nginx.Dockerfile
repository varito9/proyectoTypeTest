# Stage 1: Build the Vue.js application
FROM node:20 AS build-stage
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
# Copia nginx.conf a la etapa de construcción para que esté disponible después
COPY nginx.conf /app/nginx.conf
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the built assets from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copia la configuración de Nginx desde la etapa de construcción
COPY --from=build-stage /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]