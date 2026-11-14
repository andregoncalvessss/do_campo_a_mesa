#!/usr/bin/env bash
# Passo 8: publicação no Azure (App Service + Blob Storage + Static Web Apps).
# Requisitos: Azure CLI (az login feito), zip, Node.js. Correr a partir da raiz do repositório.
# Os segredos são lidos de variáveis de ambiente: NUNCA os escreva neste ficheiro.
#
#   export MONGODB_URI='mongodb+srv://utilizador:password@cluster0.xxxxx.mongodb.net/do-campo-a-mesa'
#   export JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
#   ./deploy.sh
set -euo pipefail

# Nomes dos recursos (a Web App e a storage account têm de ser únicos em todo o Azure)
RG="${RG:-dcm-rg}"
LOCAL="${LOCAL:-westeurope}"
PLANO="${PLANO:-dcm-plan}"
API="${API:-dcm-api}"
WEB="${WEB:-dcm-web}"
STORAGE="${STORAGE:-dcmimagens}"
CONTAINER="${CONTAINER:-produtos}"

: "${MONGODB_URI:?Defina MONGODB_URI (connection string do Atlas)}"
: "${JWT_SECRET:?Defina JWT_SECRET (diferente do de desenvolvimento)}"

echo "1/5 Resource group e plano"
az group create -n "$RG" -l "$LOCAL" -o none
az appservice plan create -n "$PLANO" -g "$RG" --sku B1 --is-linux -o none

echo "2/5 Storage das imagens"
az storage account create -n "$STORAGE" -g "$RG" -l "$LOCAL" --sku Standard_LRS --allow-blob-public-access true -o none
STORAGE_CONN="$(az storage account show-connection-string -n "$STORAGE" -g "$RG" -o tsv)"
az storage container create -n "$CONTAINER" --connection-string "$STORAGE_CONN" --public-access blob -o none

echo "3/5 SPA (Static Web Apps)"
az staticwebapp create -n "$WEB" -g "$RG" -l "$LOCAL" -o none
URL_WEB="https://$(az staticwebapp show -n "$WEB" -g "$RG" --query defaultHostname -o tsv)"

echo "4/5 API (App Service, WebSockets e HTTPS)"
az webapp create -n "$API" -g "$RG" -p "$PLANO" --runtime "NODE:20-lts" -o none
az webapp config appsettings set -n "$API" -g "$RG" -o none --settings \
  MONGODB_URI="$MONGODB_URI" JWT_SECRET="$JWT_SECRET" CLIENT_URL="$URL_WEB" \
  STORAGE_CONN="$STORAGE_CONN" STORAGE_CONTAINER="$CONTAINER" SCM_DO_BUILD_DURING_DEPLOYMENT=true
az webapp config set -n "$API" -g "$RG" --web-sockets-enabled true -o none
az webapp update -n "$API" -g "$RG" --https-only true -o none
rm -f api.zip
(cd api && zip -qr ../api.zip . -x "node_modules/*" ".env" "uploads/*" ".mongo-dados/*")
az webapp deploy -n "$API" -g "$RG" --src-path api.zip --type zip -o none
URL_API="https://$(az webapp show -n "$API" -g "$RG" --query defaultHostName -o tsv)"

echo "5/5 Build e publicação da SPA"
printf 'VITE_API_URL=%s\nVITE_USAR_DADOS_SIMULADOS=false\n' "$URL_API" > web/.env.production
(cd web && npm ci && npm run build)
TOKEN_SWA="$(az staticwebapp secrets list -n "$WEB" -g "$RG" --query "properties.apiKey" -o tsv)"
(cd web && npx @azure/static-web-apps-cli deploy ./dist --deployment-token "$TOKEN_SWA" --env production)

echo
echo "SPA:     $URL_WEB"
echo "API:     $URL_API/api/health"
echo "Swagger: $URL_API/api-docs"
echo "Dados de exemplo: MONGODB_URI=... npm --prefix api run seed"
echo "No fim do semestre: az group delete -n $RG"
