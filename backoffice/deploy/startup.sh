#!/bin/bash
# Arranque no Azure App Service (definido como "startup file" da Web App).
# 1. Garante a extensão mongodb do PHP (compilada uma vez e guardada em /home, que é persistente).
# 2. Aponta o nginx para a pasta public/ do Laravel.
set -e
EXT_DIR=/home/site/ext
INI_DIR=/home/site/ini
mkdir -p "$EXT_DIR" "$INI_DIR"

if ! php -m | grep -qi '^mongodb$'; then
  if [ ! -f "$EXT_DIR/mongodb.so" ]; then
    echo "A compilar a extensão mongodb (só na primeira vez)…"
    (pecl install mongodb </dev/null >/tmp/pecl.log 2>&1 || tail -20 /tmp/pecl.log)
    cp "$(php -r 'echo ini_get("extension_dir");')/mongodb.so" "$EXT_DIR/mongodb.so"
  fi
  echo "extension=$EXT_DIR/mongodb.so" > "$INI_DIR/mongodb.ini"
fi

cp /home/site/wwwroot/deploy/nginx.conf /etc/nginx/sites-available/default
service nginx reload

cd /home/site/wwwroot
# Pastas de escrita do Laravel (sessões, cache e vistas compiladas)
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache/data storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache
php artisan config:cache || true
php artisan view:cache || true
