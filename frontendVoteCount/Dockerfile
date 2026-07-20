# ---------------------------------------------------------------
# FRONTEND REACT — Multi-stage build
# ---------------------------------------------------------------

# -- Stage 1 : Build avec Node 22 ------------------------------─
FROM node:22-alpine AS build

WORKDIR /app

# Cache Docker : package.json d'abord
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copie du reste + build Vite
COPY . .
RUN npm run build

# -- Stage 2 : Serve avec nginx --------------------------------─
FROM nginx:alpine

# Retire la config par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copie le build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copie la config nginx custom
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]