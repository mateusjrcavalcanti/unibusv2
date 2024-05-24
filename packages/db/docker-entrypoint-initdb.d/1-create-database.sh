#!/bin/bash

# Extrai as variáveis da URL
DBUSER=$(echo $DATABASE_URL | sed -e 's,postgres://\(.*\):\(.*\)@.*,\1,')
DBPASSWORD=$(echo $DATABASE_URL | sed -e 's,postgres://\(.*\):\(.*\)@.*,\2,')
HOST=$(echo $DATABASE_URL | sed -e 's,postgres://.*@\(.*\):.*,\1,')
PORT=$(echo $DATABASE_URL | sed -e 's,postgres://.*:\(.*\)/.*,\1,')
DBNAME=$(echo $DATABASE_URL | sed -e 's,postgres://.*@.*:.*\/\(.*\),\1,')

# Imprime as variáveis
echo "----------------------------------"
echo "DBUSER: $DBUSER"
echo "DBPASSWORD: $DBPASSWORD"
echo "HOST: $HOST"
echo "PORT: $PORT"
echo "DBNAME: $DBNAME"
echo "----------------------------------"

# Verifica se o usuário já existe
EXISTING_USER=$(psql -U $POSTGRES_USER -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DBUSER'")
if [ -z "$EXISTING_USER" ]; then
    # O usuário não existe, então cria
    psql -U $POSTGRES_USER -d postgres -c "CREATE ROLE $DBUSER WITH LOGIN PASSWORD '$DBPASSWORD';"
fi

# Verifica se o banco de dados já existe
EXISTING_DB=$(psql -U $POSTGRES_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DBNAME'")
if [ -z "$EXISTING_DB" ]; then
    # Cria o banco de dados
    psql -U $POSTGRES_USER -d postgres -c "CREATE DATABASE $DBNAME;"
    psql -U $POSTGRES_USER -d postgres -c "ALTER DATABASE $DBNAME OWNER TO $DBUSER;"
fi

# Verifica se o banco de dados shadow já existe
EXISTING_SHADOW_DB=$(psql -U $POSTGRES_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='shadow'")
if [ -z "$EXISTING_SHADOW_DB" ]; then
    # Cria o banco de dados shadow
    psql -U $POSTGRES_USER -d postgres -c "CREATE DATABASE shadow;"
    psql -U $POSTGRES_USER -d postgres -c "ALTER DATABASE shadow OWNER TO $DBUSER;"
fi