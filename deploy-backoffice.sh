#!/usr/bin/env bash
# Valorização: publica o backoffice Laravel numa terceira Web App do MESMO plano do App Service.
# Requisitos: ./deploy.sh já executado, az login feito, PHP local (para gerar a APP_KEY).
set -euo pipefail

SUFIXO="${SUFIXO:-$(cat .deploy-sufixo)}"
RG="${RG:-dcm-rg}"
PLANO="${PLANO:-dcm-plan}"
ADMIN="${ADMIN:-dcm-admin-$SUFIXO}"
WEB="${WEB:-dcm-web-$SUFIXO}"
RUNTIME_PHP="${RUNTIME_PHP:-PHP:8.5}"

MONGODB_URI="${MONGODB_URI:-$(grep -E '^MONGODB_URI=' backoffice/.env | head -1 | cut -d= -f2-)}"
MONGODB_DATABASE="${MONGODB_DATABASE:-$(grep -E '^MONGODB_DATABASE=' backoffice/.env | head -1 | cut -d= -f2-)}"
case "$MONGODB_URI" in *localhost*|*127.0.0.1*|"") echo "backoffice/.env tem de ter a MONGODB_URI do Atlas."; exit 1;; esac

echo "1/3 Web App PHP"
az webapp show -n "$ADMIN" -g "$RG" -o none 2>/dev/null || az webapp create -n "$ADMIN" -g "$RG" -p "$PLANO" --runtime "$RUNTIME_PHP" -o none
URL_ADMIN="https://$(az webapp show -n "$ADMIN" -g "$RG" --query defaultHostName -o tsv)"
URL_WEB="https://$(az webapp show -n "$WEB" -g "$RG" --query defaultHostName -o tsv)"

echo "2/3 Configuração (segredos nas App Settings)"
# A APP_KEY só é gerada na primeira vez: mudá-la invalidaria as sessões
APP_KEY_ATUAL="$(az webapp config appsettings list -n "$ADMIN" -g "$RG" --query "[?name=='APP_KEY'].value | [0]" -o tsv)"
APP_KEY="${APP_KEY_ATUAL:-base64:$(php -r 'echo base64_encode(random_bytes(32));')}"
az webapp config appsettings set -n "$ADMIN" -g "$RG" -o none --settings \
  APP_NAME="Do Campo à Mesa · Backoffice" APP_ENV=production APP_DEBUG=false APP_KEY="$APP_KEY" APP_URL="$URL_ADMIN" \
  APP_LOCALE=pt DB_CONNECTION=mongodb MONGODB_URI="$MONGODB_URI" MONGODB_DATABASE="$MONGODB_DATABASE" \
  SESSION_DRIVER=file SESSION_SECURE_COOKIE=true CACHE_STORE=file QUEUE_CONNECTION=sync LOG_CHANNEL=stderr \
  LOJA_URL="$URL_WEB" SCM_DO_BUILD_DURING_DEPLOYMENT=false \
  PHP_INI_SCAN_DIR="/usr/local/etc/php/conf.d:/home/site/ini"
az webapp config set -n "$ADMIN" -g "$RG" --startup-file "/home/site/wwwroot/deploy/startup.sh" -o none
az webapp update -n "$ADMIN" -g "$RG" --https-only true -o none

echo "3/3 Publicação do código (com vendor/ instalado localmente, sem dependências de desenvolvimento)"
(cd backoffice && composer install --no-dev --optimize-autoloader --no-interaction --quiet)
rm -f backoffice.zip
(cd backoffice && zip -qr ../backoffice.zip . -x ".env" "node_modules/*" "tests/*" "storage/logs/*.log" \
  "storage/framework/sessions/*" "storage/framework/views/*.php" "storage/framework/cache/data/*" "bootstrap/cache/*.php")
az webapp deploy -n "$ADMIN" -g "$RG" --src-path backoffice.zip --type zip -o none
(cd backoffice && composer install --no-interaction --quiet)   # repõe as dependências de desenvolvimento

echo
echo "Backoffice: $URL_ADMIN  (admin@exemplo.pt)"
