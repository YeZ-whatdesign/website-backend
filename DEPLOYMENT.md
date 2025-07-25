# Backend 项目 Linux 部署指南

## 项目概述
几何原本汽车设计公司官网后端CMS系统，基于Node.js + Express + SQLite构建。

## 系统要求
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18.x+
- npm 8.x+
- PM2 (进程管理器)
- Nginx (反向代理)

## 部署步骤

### 1. 系统准备

#### Ubuntu/Debian
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git build-essential

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### CentOS/RHEL
```bash
# 更新系统
sudo yum update -y

# 安装必要工具
sudo yum install -y curl wget git gcc-c++ make

# 安装Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 创建部署用户
```bash
# 创建专用用户
sudo useradd -m -s /bin/bash whattech
sudo usermod -aG sudo whattech

# 切换到部署用户
sudo su - whattech
```

### 3. 部署应用

#### 克隆代码
```bash
# 创建应用目录
mkdir -p /home/whattech/apps
cd /home/whattech/apps

# 克隆项目（替换为实际仓库地址）
git clone <your-repository-url> what-tech-website
cd what-tech-website/backend
```

#### 安装依赖
```bash
# 安装项目依赖
npm install --production

# 全局安装PM2
sudo npm install -g pm2
```

#### 配置环境变量
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑环境配置
nano .env
```

生产环境配置示例：
```env
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret-key-for-production
NODE_ENV=production
```

#### 创建必要目录
```bash
# 创建上传目录
mkdir -p uploads
chmod 755 uploads

# 创建日志目录
mkdir -p logs
chmod 755 logs
```

### 4. 配置PM2

创建PM2配置文件：
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'what-tech-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

启动应用：
```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u whattech --hp /home/whattech
```

### 5. 配置Nginx反向代理

安装Nginx：
```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

创建Nginx配置：
```bash
sudo nano /etc/nginx/sites-available/what-tech-backend
```

```nginx
server {
    listen 80;
    server_name api.yourdomian.com;  # 替换为实际域名

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 日志配置
    access_log /var/log/nginx/what-tech-backend.access.log;
    error_log /var/log/nginx/what-tech-backend.error.log;

    # 反向代理到Node.js应用
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 静态文件处理
    location /uploads/ {
        alias /home/whattech/apps/what-tech-website/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查
    location /api/health {
        proxy_pass http://127.0.0.1:3001;
        access_log off;
    }
}
```

启用配置：
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/what-tech-backend /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. 配置SSL证书（可选）

使用Let's Encrypt免费SSL证书：
```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d api.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. 防火墙配置

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 8. 监控和维护

#### 查看应用状态
```bash
# PM2状态
pm2 status
pm2 logs what-tech-backend

# 系统资源
htop
df -h
```

#### 应用更新
```bash
# 拉取最新代码
cd /home/whattech/apps/what-tech-website/backend
git pull origin main

# 安装新依赖
npm install --production

# 重启应用
pm2 restart what-tech-backend
```

#### 备份数据库
```bash
# 创建备份脚本
nano /home/whattech/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/whattech/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /home/whattech/apps/what-tech-website/backend/data/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# 保留最近7天的备份
find $BACKUP_DIR -name "database_*.sqlite" -mtime +7 -delete
```

```bash
# 设置执行权限
chmod +x /home/whattech/backup-db.sh

# 设置定时备份
crontab -e
# 添加：每天凌晨2点备份
# 0 2 * * * /home/whattech/backup-db.sh
```

## 故障排除

### 常见问题

1. **端口被占用**
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

2. **权限问题**
```bash
sudo chown -R whattech:whattech /home/whattech/apps/what-tech-website/backend
chmod -R 755 /home/whattech/apps/what-tech-website/backend
```

3. **内存不足**
```bash
# 检查内存使用
free -h
# 调整PM2实例数量
pm2 scale what-tech-backend 2
```

4. **查看详细日志**
```bash
# PM2日志
pm2 logs what-tech-backend --lines 100

# Nginx日志
sudo tail -f /var/log/nginx/what-tech-backend.error.log

# 系统日志
sudo journalctl -u nginx -f
```

## 性能优化

1. **启用Gzip压缩**（在Nginx配置中添加）
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

2. **配置缓存**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **限制请求大小**
```nginx
client_max_body_size 10M;
```

## 安全建议

1. 定期更新系统和依赖包
2. 使用强密码和SSH密钥认证
3. 配置fail2ban防止暴力破解
4. 定期备份数据
5. 监控系统资源和日志
6. 使用HTTPS加密传输