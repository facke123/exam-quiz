#!/bin/bash
# ==============================================================================
# 软考刷题系统 - 线上 MySQL 数据库备份与恢复运维脚本
# 用法:
#   sudo bash backup-db.sh          # 立即创建一次备份
#   sudo bash backup-db.sh list     # 查看所有已有备份
#   sudo bash backup-db.sh restore <备份文件路径> # 还原指定备份
# ==============================================================================

set -e

BACKUP_DIR="/opt/app/exam-quiz/backups/mysql"
if [ ! -d "/opt/app/exam-quiz" ] && [ -d "/opt/exam-quiz" ]; then
    BACKUP_DIR="/opt/exam-quiz/backups/mysql"
fi
mkdir -p "$BACKUP_DIR"

COMMAND="$1"

if [ "$COMMAND" = "list" ]; then
    echo "================================================================="
    echo "📂 线上 MySQL 数据库历史备份清单 ($BACKUP_DIR):"
    echo "================================================================="
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "暂无备份文件"
    exit 0
fi

if [ "$COMMAND" = "restore" ]; then
    FILE="$2"
    if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
        echo "❌ 请指定有效的备份文件路径！例如: bash backup-db.sh restore $BACKUP_DIR/exam_quiz_xxx.sql.gz"
        exit 1
    fi
    echo "⚠️ 警告: 正在将数据库还原为 $FILE，此操作将覆盖现有数据！"
    read -p "确认还原请输入 YES: " CONFIRM
    if [ "$CONFIRM" != "YES" ]; then
        echo "操作已取消。"
        exit 0
    fi
    echo "🔄 正在还原数据库..."
    gzip -dc "$FILE" | docker exec -i exam-mysql mysql -uroot -proot123 exam_quiz
    echo "✅ 数据库还原完成！"
    exit 0
fi

# 默认: 执行立即全量备份
NOW=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/exam_quiz_${NOW}.sql.gz"

echo "================================================================="
echo "🚀 正在执行 MySQL 数据库全量备份..."
echo "================================================================="

if docker exec -i exam-mysql mysqldump -uroot -proot123 \
    --single-transaction --quick --default-character-set=utf8mb4 \
    --databases exam_quiz | gzip > "$BACKUP_FILE"; then
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✅ 数据库备份成功！"
    echo "📁 备份文件: $BACKUP_FILE"
    echo "📦 文件大小: $FILE_SIZE"
    echo "🕒 备份时间: $(date '+%Y-%m-%d %H:%M:%S')"
else
    echo "❌ 备份失败！"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 自动清理 30 天前的旧备份
find "$BACKUP_DIR" -name "exam_quiz_*.sql.gz" -type f -mtime +30 -exec rm -f {} \;
echo "🧹 已自动清理 30 天前的历史旧备份。"
echo "================================================================="
