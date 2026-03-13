# Frontend Dockerfile - React + Vite build com Nginx
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação React
RUN npm run build

# Stage 2: Nginx para servir o build
FROM nginx:alpine

# Copiar build do React
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80 (será mapeada para 8881 no host)
EXPOSE 80

# Comando padrão do Nginx
CMD ["nginx", "-g", "daemon off;"]
