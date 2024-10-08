include .env

seed:
	PGPASSWORD=$(SUPABASE_DB_PASSWORD) psql $(DATABASE_URL) -f seed.sql