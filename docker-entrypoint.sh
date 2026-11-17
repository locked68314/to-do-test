#!/bin/sh
set -e

# Las migraciones se aplican sobre el código ya compilado, sin ts-node.
echo "Aplicando migraciones pendientes..."
node ./node_modules/typeorm/cli.js -d dist/database/data-source.js migration:run

echo "Arrancando la API..."
exec node dist/main
