#!/usr/bin/env bash
# Passo 8: publicação no Azure (App Service para a API e para a SPA + Blob Storage).
# Requisitos: Azure CLI (az login feito), zip, Node.js. Correr a partir da raiz do repositório.
# Os segredos são lidos de variáveis de ambiente: NUNCA os escreva neste ficheiro.
#
#   ./deploy.sh          usa a MONGODB_URI do api/.env (Atlas) e gera um JWT_SECRET novo
# Para escolher outros valores: MONGODB_URI=... JWT_SECRET=... LOCAL=northeurope ./deploy.sh
set -euo pipefail

# Nomes dos recursos. A Web App e a storage account têm de ser únicos em todo o Azure,
# por isso levam um sufixo; para repetir o deploy use o mesmo SUFIXO (fica guardado em .deploy-sufixo).
[ -f .deploy-sufixo ] || node -e "console.log(require('crypto').randomBytes(3).toString('hex'))" > .deploy-sufixo
SUFIXO="${SUFIXO:-$(cat .deploy-sufixo)}"
RG="${RG:-dcm-rg}"
# As subscrições Azure for Students só aceitam algumas regiões (az policy assignment list)
LOCAL="${LOCAL:-denmarkeast}"
PLANO="${PLANO:-dcm-plan}"
API="${API:-dcm-api-$SUFIXO}"
WEB="${WEB:-dcm-web-$SUFIXO}"
STORAGE="${STORAGE:-dcmimagens$SUFIXO}"
CONTAINER="${CONTAINER:-produtos}"
RUNTIME="${RUNTIME:-NODE:22-lts}"
SKU="${SKU:-B1}"

# Sem MONGODB_URI no ambiente, usa a do api/.env (tem de ser a do Atlas, não a local)
if [ -z "${MONGODB_URI:-}" ] && [ -f api/.env ]; then
  MONGODB_URI="$(grep -E '^MONGODB_URI=' api/.env | head -1 | cut -d= -f2-)"
fi
: "${MONGODB_URI:?Defina MONGODB_URI (connection string do Atlas)}"
case "$MONGODB_URI" in *localhost*|*127.0.0.1*) echo "MONGODB_URI aponta para localhost: use a connection string do Atlas."; exit 1;; esac
# JWT_SECRET de produção, diferente do de desenvolvimento
JWT_SECRET="${JWT_SECRET:-$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")}"

# Numa subscrição nova, os fornecedores de recursos podem não estar registados
for fornecedor in Microsoft.Web Microsoft.Storage; do
  [ "$(az provider show -n "$fornecedor" --query registrationState -o tsv 2>/dev/null)" = "Registered" ] || az provider register -n "$fornecedor" --wait -o none
done

echo "1/5 Resource group e plano"
# O resource group só guarda metadados: se já existir (noutra região), é reutilizado
az group show -n "$RG" -o none 2>/dev/null || az group create -n "$RG" -l "$LOCAL" -o none
az appservice plan create -n "$PLANO" -g "$RG" -l "$LOCAL" --sku "$SKU" --is-linux -o none

echo "2/5 Storage das imagens"
az storage account create -n "$STORAGE" -g "$RG" -l "$LOCAL" --sku Standard_LRS --allow-blob-public-access true -o none
STORAGE_CONN="$(az storage account show-connection-string -n "$STORAGE" -g "$RG" -o tsv)"
az storage container create -n "$CONTAINER" --connection-string "$STORAGE_CONN" --public-access blob -o none

echo "3/5 SPA (App Service, ficheiros estáticos)"
# As Static Web Apps só existem em regiões que a subscrição Azure for Students não permite,
# por isso a SPA é servida por uma segunda Web App no MESMO plano (sem custo adicional).
# O pm2 (já incluído na imagem Node do App Service) serve o dist/ com fallback para index.html.
az webapp create -n "$WEB" -g "$RG" -p "$PLANO" --runtime "$RUNTIME" -o none
az webapp config appsettings set -n "$WEB" -g "$RG" -o none --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false
az webapp config set -n "$WEB" -g "$RG" --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa" -o none
az webapp update -n "$WEB" -g "$RG" --https-only true -o none
URL_WEB="https://$(az webapp show -n "$WEB" -g "$RG" --query defaultHostName -o tsv)"

echo "4/5 API (App Service, WebSockets e HTTPS)"
az webapp create -n "$API" -g "$RG" -p "$PLANO" --runtime "$RUNTIME" -o none
az webapp config appsettings set -n "$API" -g "$RG" -o none --settings \
  MONGODB_URI="$MONGODB_URI" JWT_SECRET="$JWT_SECRET" CLIENT_URL="$URL_WEB" \
  STORAGE_CONN="$STORAGE_CONN" STORAGE_CONTAINER="$CONTAINER" SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  MONGOMS_DISABLE_POSTINSTALL=1
az webapp config set -n "$API" -g "$RG" --web-sockets-enabled true -o none
az webapp update -n "$API" -g "$RG" --https-only true -o none
rm -f api.zip
(cd api && zip -qr ../api.zip . -x "node_modules/*" ".env" "uploads/*" ".mongo-dados/*")
az webapp deploy -n "$API" -g "$RG" --src-path api.zip --type zip -o none
URL_API="https://$(az webapp show -n "$API" -g "$RG" --query defaultHostName -o tsv)"

echo "5/5 Build e publicação da SPA"
printf 'VITE_API_URL=%s\nVITE_USAR_DADOS_SIMULADOS=false\n' "$URL_API" > web/.env.production
(cd web && npm ci && npm run build)
rm -f web.zip
(cd web/dist && zip -qr ../../web.zip .)
az webapp deploy -n "$WEB" -g "$RG" --src-path web.zip --type zip -o none

echo
echo "SPA:     $URL_WEB"
echo "API:     $URL_API/api/health"
echo "Swagger: $URL_API/api-docs"
echo "Dados de exemplo: MONGODB_URI=... npm --prefix api run seed"
echo "No fim do semestre: az group delete -n $RG"
