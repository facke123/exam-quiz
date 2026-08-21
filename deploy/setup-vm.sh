#!/bin/bash
set -ex

# Log all output to /var/log/exam-quiz-deploy.log
exec > >(tee -a /var/log/exam-quiz-deploy.log) 2>&1

echo "=== Starting Google Cloud VM Initialization ==="

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release git

# 1. Install official Docker and Compose plugin
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

# 2. Clone/Pull latest project repository
mkdir -p /opt/app
if [ -d "/opt/app/exam-quiz" ]; then
    cd /opt/app/exam-quiz
    git pull origin main
else
    git clone https://github.com/facke123/exam-quiz.git /opt/app/exam-quiz
    cd /opt/app/exam-quiz
fi

# 3. Launch full stack with Docker Compose
cd /opt/app/exam-quiz/docker
docker compose -f docker-compose.gcp.yml up -d --build

echo "=== Google Cloud Deployment Completed Successfully ==="
