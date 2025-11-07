# --- Etapa de Desarrollo (development) ---
# Esta etapa instala todas las dependencias y sirve como base para el hot-reloading.
# Es utilizada por `docker-compose.dev.yml`.
FROM node:20-alpine AS development

WORKDIR /app

# Copia los archivos de dependencias y las instala.
COPY package*.json ./
RUN npm install

# Copia el resto del código (será sobreescrito por el volumen en desarrollo).
COPY . .

# Expone el puerto de Vite para el desarrollo.
EXPOSE 5174

# Comando por defecto para iniciar el servidor de desarrollo.
CMD ["npm", "run", "dev", "--", "--host"]

# --- Etapa de Producción (production) ---
# Esta etapa construye la aplicación para producción.
# Es utilizada por `nginx.Dockerfile` en el `docker-compose.prod.yml`.
FROM development AS production
RUN npm run build