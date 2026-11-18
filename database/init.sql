-- Combined init script for Docker local postgres
\i /docker-entrypoint-initdb.d/01-schema.sql
\i /docker-entrypoint-initdb.d/02-seed.sql
