#!/bin/sh
# Creates the database the Playwright suite resets on every run, so e2e never
# touches the dev database sharing this container.
#
# Postgres only executes /docker-entrypoint-initdb.d on a *fresh* data volume.
# For a container that already has one, create it by hand instead:
#   docker compose exec -T postgres psql -U underscore -c 'CREATE DATABASE underscore_e2e'
set -e

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -c "CREATE DATABASE underscore_e2e"
