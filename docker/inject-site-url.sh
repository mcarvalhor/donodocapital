#!/bin/sh
# Executado automaticamente pelo entrypoint oficial da imagem `nginx` antes do
# servidor subir (ver `/docker-entrypoint.d/` na documentação da imagem).
#
# O Next.js inlina variáveis `NEXT_PUBLIC_*` no JavaScript em TEMPO DE BUILD. Como
# este container serve um build já pronto (estático), a única forma de permitir
# configurar `NEXT_PUBLIC_SITE_URL` em tempo de execução (`docker run -e ...`) é
# substituir, nos arquivos já gerados, o valor placeholder usado durante o build
# pelo valor real da variável de ambiente — é exatamente isso que este script faz.
#
# Idempotente: se o placeholder já tiver sido substituído (ex.: container
# reiniciado sem recriar), simplesmente não encontra nada para trocar.
set -eu

PLACEHOLDER='https://build-time-placeholder.invalid'
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://donodocapital.com.br}"
HTML_ROOT='/usr/share/nginx/html'

echo "[inject-site-url] Aplicando NEXT_PUBLIC_SITE_URL=${SITE_URL} aos arquivos estáticos..."

grep -rl "$PLACEHOLDER" "$HTML_ROOT" 2>/dev/null | while IFS= read -r file; do
  sed -i "s#${PLACEHOLDER}#${SITE_URL}#g" "$file"
done

echo "[inject-site-url] Concluído."
