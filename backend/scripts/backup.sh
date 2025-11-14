#!/bin/bash

# Database backup script for Amori app
# Usage: ./backup.sh [output_directory]

set -e

# Configuration
OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${OUTPUT_DIR}/amori_backup_${TIMESTAMP}.sql"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_DB_URL" ] && [ -z "$DATABASE_URL" ]; then
  echo "Error: SUPABASE_DB_URL or DATABASE_URL must be set"
  echo "You can set it in .env file or as environment variable"
  exit 1
fi

# Use DATABASE_URL if available, otherwise construct from SUPABASE_DB_URL
DB_URL="${DATABASE_URL:-$SUPABASE_DB_URL}"

echo "Starting database backup..."
echo "Output file: $BACKUP_FILE"

# Create backup using pg_dump
pg_dump "$DB_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --format=plain \
  --file="$BACKUP_FILE"

# Compress backup
gzip -f "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Get file size
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

echo "Backup completed successfully!"
echo "File: $COMPRESSED_FILE"
echo "Size: $FILE_SIZE"

# Optional: Keep only last 7 backups
if [ -d "$OUTPUT_DIR" ]; then
  cd "$OUTPUT_DIR"
  ls -t amori_backup_*.sql.gz | tail -n +8 | xargs -r rm
  echo "Cleaned up old backups (kept last 7)"
fi

