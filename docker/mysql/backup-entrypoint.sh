#!/bin/sh
set -e

echo "=== [MySQL Backup Service] Initializing Database Backup Daemon ==="
mkdir -p /backups

# 备份函数
do_backup() {
    NOW=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="/backups/exam_quiz_${NOW}.sql.gz"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 正在执行 MySQL 数据库全量备份..."
    
    if mysqldump -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
        --single-transaction --quick --default-character-set=utf8mb4 \
        --databases "$MYSQL_DATABASE" | gzip > "$BACKUP_FILE"; then
        FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 数据库备份成功: $BACKUP_FILE (大小: $FILE_SIZE)"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 备份失败！"
        rm -f "$BACKUP_FILE"
    fi

    # 清理 30 天前的旧备份
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🧹 正在清理 ${KEEP_DAYS:-30} 天前的历史旧备份..."
    find /backups -name "exam_quiz_*.sql.gz" -type f -mtime +${KEEP_DAYS:-30} -exec rm -f {} \;
}

# 1. 启动时先等待 MySQL 就绪并执行一次初始基准备份
sleep 15
do_backup || true

# 2. 常驻循环：每 12 小时（43200秒）自动全量归档备份一次，确保零数据丢失
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🕒 开启定时备份调度器 (每12小时全量备份，保留30天)..."
while true; do
    sleep 43200
    do_backup || true
done
