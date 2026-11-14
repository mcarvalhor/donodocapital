# syntax=docker/dockerfile:1
#
# Imagem de produção do "Dono do Capital": site 100% estático, construído com
# Next.js (output: 'export') e servido por Nginx sobre Alpine Linux — sem Node.js
# em produção, sem servidor de aplicação, apenas arquivos HTML/CSS/JS estáticos.
#
# Build:
#   docker build -t donodocapital .
#   docker build -t donodocapital --build-arg NEXT_PUBLIC_SITE_URL=https://meudominio.com .
#   docker build -t donodocapital --build-arg PIX_KEY=sua-chave-pix-aleatoria .
#
# Run (porta 80 HTTP dentro do container, sem SSL — faça TLS num proxy reverso
# na frente, ex.: outro Nginx, Caddy, Traefik ou o load balancer da sua infra):
#   docker run -p 8080:80 donodocapital
#   docker run -p 8080:80 -e NEXT_PUBLIC_SITE_URL=https://meudominio.com donodocapital

# ---------- Etapa 1: build do site estático ----------
FROM node:20-alpine AS builder
WORKDIR /app

# `NEXT_PUBLIC_*` são inlinadas no JavaScript pelo Next.js em TEMPO DE BUILD, não
# em tempo de execução — por isso usamos um valor "placeholder" aqui, e o
# entrypoint da imagem final (ver etapa 2) o substitui pelo valor real da
# variável de ambiente `NEXT_PUBLIC_SITE_URL` a cada `docker run`, permitindo
# configurar a URL do site sem precisar reconstruir a imagem.
# Precisa ser uma URL sintaticamente válida (o Next.js faz `new URL(...)` nela em
# `src/app/layout.tsx`) — por isso usamos o domínio reservado `.invalid`
# (RFC 2606), que nunca resolve de verdade, só para servir de marcador.
ARG NEXT_PUBLIC_SITE_URL=https://build-time-placeholder.invalid
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# `PIX_KEY` (sem o prefixo `NEXT_PUBLIC_`) é lida apenas em um Server Component
# (`src/app/apoie/page.tsx`), em build-time — o payload "Pix Copia e Cola" (padrão
# BR Code/EMV) correspondente é gerado e embutido como QR Code (SVG) diretamente
# no HTML estático. Diferente de `NEXT_PUBLIC_SITE_URL`, ela NÃO tem substituição
# em tempo de execução: para trocar a chave PIX é necessário reconstruir a imagem
# com um novo `--build-arg`. `PIX_MERCHANT_NAME`/`PIX_MERCHANT_CITY` são opcionais
# (campos exigidos pelo payload, exibidos no app de quem paga ao escanear o QR Code).
ARG PIX_KEY=
ARG PIX_MERCHANT_NAME=
ARG PIX_MERCHANT_CITY=
ENV PIX_KEY=${PIX_KEY}
ENV PIX_MERCHANT_NAME=${PIX_MERCHANT_NAME}
ENV PIX_MERCHANT_CITY=${PIX_MERCHANT_CITY}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Etapa 2: Nginx (Alpine) servindo os arquivos estáticos ----------
FROM nginx:1.27-alpine AS runner

# Valor padrão da URL pública do site — sobrescrevível via `-e NEXT_PUBLIC_SITE_URL=...`
# no `docker run`. É substituído nos arquivos estáticos pelo script de entrypoint
# abaixo, toda vez que o container inicia.
ENV NEXT_PUBLIC_SITE_URL=https://donodocapital.com.br

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# O entrypoint oficial da imagem `nginx` executa, em ordem alfabética, todo script
# executável encontrado em `/docker-entrypoint.d/` antes de iniciar o Nginx — é o
# mecanismo documentado da própria imagem para customizações de inicialização.
COPY docker/inject-site-url.sh /docker-entrypoint.d/20-inject-site-url.sh
RUN chmod +x /docker-entrypoint.d/20-inject-site-url.sh

COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80
