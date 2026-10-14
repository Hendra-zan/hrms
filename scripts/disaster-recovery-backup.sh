#!/bin/bash
# ============================================================
# HRMS Pro Automated Disaster Recovery & Backup Script
# Retention Policy: Keep last 30 daily backups
# ============================================================

set -e

BACKUP_DIR="/home/hrms/HRMS-Pro/backups/drp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/hrms_db_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="supabase_db_HRMS_Pro"

mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo " Starting HRMS Pro Automated DB Backup..."
echo " Timestamp: ${TIMESTAMP}"
echo "=========================================="

# 1. Dump database and compress
docker exec -t "${CONTAINER_NAME}" pg_dumpall -U postgres | gzip -9 > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo " Backup created successfully: ${BACKUP_FILE} (${FILE_SIZE})"

# 2. Rotate backups (Delete backups older than 30 days)
echo " Running retention cleanup (30 days policy)..."
find "${BACKUP_DIR}" -type f -name "hrms_db_backup_*.sql.gz" -mtime +30 -exec rm -f {} \;

echo " Backup process finished cleanly at $(date)."
