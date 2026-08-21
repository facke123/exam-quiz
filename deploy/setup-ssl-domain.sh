#!/bin/bash
# ==============================================================================
# 软考刷题系统 - 自定义域名与 Let's Encrypt SSL HTTPS 证书自动配置脚本
# 用法: sudo bash setup-ssl-domain.sh <H5前台域名> <Admin后台域名> <邮箱>
# 示例: sudo bash setup-ssl-domain.sh quiz.example.com admin.example.com admin@example.com
# ==============================================================================

set -e

H5_DOMAIN="$1"
ADMIN_DOMAIN="$2"
EMAIL="$3"

if [ -z "$H5_DOMAIN" ] || [ -z "$ADMIN_DOMAIN" ]; then
    echo "================================================================="
    echo "❌ 参数缺失！"
    echo "用法: sudo bash setup-ssl-domain.sh <前台域名> <后台域名> [通知邮箱]"
    echo "示例: sudo bash setup-ssl-domain.sh quiz.yourdomain.com admin.yourdomain.com you@email.com"
    echo "================================================================="
    exit 1
fi

if [ -z "$EMAIL" ]; then
    EMAIL="admin@${H5_DOMAIN}"
fi

echo "================================================================="
echo "🌐 正在为软考刷题系统配置自定义域名与 SSL HTTPS 证书..."
echo "📱 前台 H5 域名: ${H5_DOMAIN}"
echo "🖥️ 后台 Admin 域名: ${ADMIN_DOMAIN}"
echo "📧 证书通知邮箱: ${EMAIL}"
echo "================================================================="

# 1. 安装 Nginx 和 Certbot
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y certbot python3-certbot-nginx nginx

# 2. 申请 Let's Encrypt 证书
echo "🔐 正在向 Let's Encrypt 申请 SSL 证书..."
certbot certonly --nginx \
    -d "${H5_DOMAIN}" \
    -d "${ADMIN_DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --keep-until-expiring \
    --non-interactive || {
        echo "⚠️ Certbot 自动申请遇到问题，正在尝试使用独立模式..."
        systemctl stop nginx || true
        certbot certonly --standalone \
            -d "${H5_DOMAIN}" \
            -d "${ADMIN_DOMAIN}" \
            --email "${EMAIL}" \
            --agree-tos \
            --no-eff-email \
            --keep-until-expiring \
            --non-interactive
    }

# 3. 写入前台 H5 域名 Nginx 配置 (HTTPS 80 -> 443)
cat <<EOF > /etc/nginx/sites-available/exam-h5.conf
server {
    listen 80;
    server_name ${H5_DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${H5_DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${H5_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${H5_DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

# 4. 写入后台 Admin 域名 Nginx 配置 (HTTPS 80 -> 443)
cat <<EOF > /etc/nginx/sites-available/exam-admin.conf
server {
    listen 80;
    server_name ${ADMIN_DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${ADMIN_DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${H5_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${H5_DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    location / {
        proxy_pass http://127.0.0.1:81;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

# 5. 启用站点并重启 Nginx
ln -sf /etc/nginx/sites-available/exam-h5.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/exam-admin.conf /etc/nginx/sites-enabled/

# 6. 配置 SSL 证书自动续期定时任务
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 1 * * certbot renew --quiet && systemctl reload nginx") | crontab -

systemctl restart nginx || nginx -s reload

echo "================================================================="
echo "🎉 自定义域名与 HTTPS 证书配置成功！"
echo "📱 前台访问地址: https://${H5_DOMAIN}/"
echo "🖥️ 后台访问地址: https://${ADMIN_DOMAIN}/"
echo "================================================================="
