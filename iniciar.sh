#!/usr/bin/env bash
# Arranca tudo com um só comando: base de dados local, API, SPA e backoffice.
#   ./iniciar.sh            arranca o que ainda não estiver a correr
#   ./iniciar.sh --seed     idem, e repõe os dados de exemplo
# Ctrl+C pára apenas o que este script arrancou. Os registos ficam em .logs/.
set -uo pipefail
cd "$(dirname "$0")"

RAIZ="$(pwd)"
LOGS="$RAIZ/.logs"
mkdir -p "$LOGS"
PIDS=()
SEED=false
[ "${1:-}" = "--seed" ] && SEED=true

a_escutar() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

# Espera até a porta responder (ou desiste ao fim de N segundos)
esperar() { # porta, segundos, nome
  for _ in $(seq 1 "$2"); do a_escutar "$1" && return 0; sleep 1; done
  echo "  ✘ $3 não arrancou em $2 s. Veja $LOGS/$3.log"
  return 1
}

# Arranca um serviço se a porta estiver livre
arrancar() { # nome, porta, segundos, comando...
  local nome="$1" porta="$2" segundos="$3"; shift 3
  if a_escutar "$porta"; then
    echo "  • $nome já está a correr (porta $porta)"
    return 0
  fi
  "$@" >"$LOGS/$nome.log" 2>&1 &
  PIDS+=($!)
  esperar "$porta" "$segundos" "$nome" && echo "  ✔ $nome (porta $porta)"
}

# Termina um processo e todos os seus descendentes (npm -> nodemon -> node, mongod, php -S…)
matar_arvore() {
  local filho
  for filho in $(pgrep -P "$1" 2>/dev/null); do matar_arvore "$filho"; done
  kill -TERM "$1" 2>/dev/null
}

parar() {
  trap - INT TERM
  echo
  [ ${#PIDS[@]} -gt 0 ] && echo "A parar o que este script arrancou…"
  for pid in "${PIDS[@]:-}"; do
    [ -n "$pid" ] && matar_arvore "$pid"
  done
  wait 2>/dev/null
  echo "Parado."
  exit 0
}
trap parar INT TERM

# --- Pré-requisitos -------------------------------------------------------
command -v node >/dev/null || { echo "Falta o Node.js (https://nodejs.org)"; exit 1; }
[ -d api/node_modules ] || { echo "A instalar as dependências da API…"; npm --prefix api install --no-audit --no-fund >/dev/null; }
[ -d web/node_modules ] || { echo "A instalar as dependências da SPA…"; npm --prefix web install --no-audit --no-fund >/dev/null; }
[ -f api/.env ] || {
  cp api/.env.example api/.env
  SEGREDO="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
  sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$SEGREDO/" api/.env && rm -f api/.env.bak
  echo "Criado api/.env com um JWT_SECRET novo."
}
[ -f web/.env ] || cp web/.env.example web/.env

echo "Do Campo à Mesa: a arrancar…"

# --- 1. Base de dados -----------------------------------------------------
# Só arranca o MongoDB local se a API estiver configurada para localhost (e não para o Atlas)
if grep -q '^MONGODB_URI=mongodb://\(localhost\|127\.0\.0\.1\)' api/.env; then
  arrancar "base-de-dados" 27017 90 npm --prefix api run bd || parar
else
  echo "  • base de dados: MongoDB Atlas (definido em api/.env)"
fi

# --- 2. API ---------------------------------------------------------------
arrancar "api" 3000 30 npm --prefix api run dev || parar

# Dados de exemplo: a pedido (--seed) ou se o catálogo estiver vazio
VAZIO="$(curl -s -m 5 http://localhost:3000/api/products | head -c 2)"
if $SEED || [ "$VAZIO" = "[]" ]; then
  echo "  A repor os dados de exemplo…"
  npm --prefix api run seed >"$LOGS/seed.log" 2>&1 && echo "  ✔ dados de exemplo (password123)" || echo "  ✘ seed falhou. Veja $LOGS/seed.log"
fi

# --- 3. SPA ---------------------------------------------------------------
arrancar "web" 5173 30 npm --prefix web run dev || parar

# --- 4. Backoffice Laravel (opcional: precisa de PHP e do Composer) --------
if command -v php >/dev/null && [ -f backoffice/artisan ]; then
  if [ ! -d backoffice/vendor ] && command -v composer >/dev/null; then
    echo "  A instalar as dependências do backoffice…"
    (cd backoffice && composer install --no-interaction --quiet)
  fi
  if [ ! -f backoffice/.env ]; then
    cp backoffice/.env.example backoffice/.env
    php backoffice/artisan key:generate --quiet
  fi
  [ -d backoffice/vendor ] && arrancar "backoffice" 8000 20 php backoffice/artisan serve --port=8000
else
  echo "  • backoffice: ignorado (PHP não instalado)"
fi

cat <<EOF

Pronto:
  Loja (SPA)      http://localhost:5173
  API             http://localhost:3000/api/health
  Swagger UI      http://localhost:3000/api-docs
  Backoffice      http://localhost:8000

Utilizadores (password: password123):
  comprador  tasca@exemplo.pt · ana@exemplo.pt
  produtor   horta@exemplo.pt
  admin      admin@exemplo.pt

EOF

if [ ${#PIDS[@]} -eq 0 ]; then
  echo "Já estava tudo a correr; este script não arrancou nada."
  exit 0
fi
echo "Ctrl+C para parar. Registos em .logs/"
wait
