#!/bin/bash
# ==============================================================================
# HRMS Pro - Off-site Cloud Backup Script
# Synchronizes database backups to cloud storage (Backblaze B2, S3, etc.)
# ==============================================================================

# Configurations
PROJECT_DIR="/home/hrms/HRMS-Pro"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/backup-cloud.log"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Ensure logs directory exists
mkdir -p "$PROJECT_DIR/logs"

echo "[$DATE] Starting off-site backup sync..." >> "$LOG_FILE"

# Check if backup directory exists and has files
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR")" ]; then
    echo "[$DATE] ERROR: Backup directory is empty or does not exist. Run database backup first." >> "$LOG_FILE"
    exit 1
fi

# Ensure rclone is installed
if ! command -v rclone &> /dev/null; then
    echo "[$DATE] WARNING: rclone is not installed. Installing rclone..." >> "$LOG_FILE"
    # Attempt non-interactive rclone installation if curl is available
    if command -v curl &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y rclone >> "$LOG_FILE" 2>&1
    else
        echo "[$DATE] ERROR: rclone installation failed (curl not found). Install rclone manually." >> "$LOG_FILE"
        exit 1
    fi
fi

# Check if rclone remote 'hrms-backups' is configured
# User should configure it using: rclone config
if ! rclone listremotes | grep -q "hrms-backups:"; then
    echo "[$DATE] ERROR: rclone remote 'hrms-backups' is not configured. Please run: rclone config" >> "$LOG_FILE"
    echo "[$DATE] Sync skipped. Local backups are safe." >> "$LOG_FILE"
    exit 1
fi

# Synchronize local backups folder to cloud storage
# hrms-backups:hrms-db-backups is the remote path
rclone sync "$BACKUP_DIR" hrms-backups:hrms-db-backups --log-file="$LOG_FILE" --log-level INFO

if [ $? -eq 0 ]; then
    echo "[$DATE] SUCCESS: Off-site database backups synchronized successfully." >> "$LOG_FILE"
else
    echo "[$DATE] ERROR: Off-site database backups synchronization failed. See log details." >> "$LOG_FILE"
fi
