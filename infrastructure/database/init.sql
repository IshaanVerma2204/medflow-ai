-- MedFlow AI — PostgreSQL Initialization Script
-- This runs once when the container is first created

-- Enable pgvector extension for semantic embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';
