#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE thrift_reporting;
    GRANT ALL PRIVILEGES ON DATABASE thrift_reporting TO $POSTGRES_USER;
EOSQL
