FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

# Copiamos el resto del código y hacemos el build
COPY . .
RUN npm run build

# --- Etapa 2: servir con nginx ---
FROM nginx:stable-alpine

# Borramos la config por defecto y copiamos la nuestra
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copiamos los archivos generados por React
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80 (donde nginx escucha)
EXPOSE 80

# Comando que mantiene nginx corriendo
CMD ["nginx", "-g", "daemon off;"]
