# Clype - Production Deployment Guide

Complete guide for deploying Clype to production using AWS (backend) and Vercel (frontend).

## 🎯 Production Architecture

```
Users
  ↓
Vercel CDN (Frontend)
  ↓ HTTPS/WSS
AWS EC2 (Backend)
  ├─ Nginx (Reverse Proxy + SSL)
  ├─ Spring Boot (Port 8080)
  ├─ MongoDB (Port 27017)
  └─ Coturn (TURN Server, Port 3478)
```

## 📋 Prerequisites

- AWS account
- Vercel account
- Google Cloud Console project (OAuth credentials)
- Domain name (optional, can use EC2 public DNS)

## 🚀 Part 1: Backend Deployment (AWS EC2)

### Step 1: Create EC2 Instance

1. Login to AWS Console → EC2 → Launch Instance
2. **Configuration:**
   - Name: `clype-backend`
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: `t2.micro` (Free tier: 1 vCPU, 1GB RAM)
   - Key pair: Create new → Download `clype-key.pem`
   - Security Group: Create with these rules:
     ```
     SSH (22):        Your IP only
     HTTP (80):       0.0.0.0/0
     HTTPS (443):     0.0.0.0/0
     Custom TCP 8080: 0.0.0.0/0  (temporary, will proxy via Nginx)
     Custom TCP 3478: 0.0.0.0/0  (TURN)
     Custom UDP 3478: 0.0.0.0/0  (TURN)
     Custom UDP 49152-65535: 0.0.0.0/0  (TURN media)
     ```
   - Storage: 30 GB gp3 (Free tier maximum)

3. Launch and note the **Public IPv4 address** (e.g., `3.87.123.45`)

Your backend URL will be: `https://ec2-3-87-123-45.compute-1.amazonaws.com`

### Step 2: Connect and Setup Server

```bash
# On your local machine
chmod 400 clype-key.pem
ssh -i clype-key.pem ubuntu@ec2-3-87-123-45.compute-1.amazonaws.com

# On EC2
sudo apt update && sudo apt upgrade -y

# Install Java 17
sudo apt install -y openjdk-17-jdk
java -version

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install Coturn (TURN server)
sudo apt install -y coturn
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn

# Create application directory
sudo mkdir -p /opt/clype
sudo chown ubuntu:ubuntu /opt/clype
```

### Step 3: Configure MongoDB

```bash
# Connect to MongoDB
mongosh

# Create database and user
use clype
db.createUser({
  user: "clyuser",
  pwd: "CHANGE_THIS_PASSWORD",
  roles: [{role: "readWrite", db: "clype"}]
})

# Create TTL indexes
db.messages.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.users.createIndex({ "googleId": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })

exit
```

### Step 4: Deploy Backend Application

```bash
# On your local machine, build JAR
cd backend
mvn clean package -DskipTests

# Copy to EC2
scp -i clype-key.pem target/backend-1.0.0.jar \
  ubuntu@ec2-3-87-123-45.compute-1.amazonaws.com:/opt/clype/

# Copy environment file
scp -i clype-key.pem .env \
  ubuntu@ec2-3-87-123-45.compute-1.amazonaws.com:/opt/clype/
```

On EC2, create `/opt/clype/.env`:
```bash
MONGODB_URI=mongodb://clyuser:CHANGE_THIS_PASSWORD@localhost:27017/clype
JWT_SECRET=$(openssl rand -base64 64)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
SERVER_PORT=8080
TURN_USERNAME=clypeuser
TURN_PASSWORD=$(openssl rand -base64 32)
```

### Step 5: Create Systemd Service

On EC2, create `/etc/systemd/system/clype-backend.service`:

```ini
[Unit]
Description=Clype Backend
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/clype
EnvironmentFile=/opt/clype/.env
ExecStart=/usr/bin/java -Xms256m -Xmx768m -jar /opt/clype/backend-1.0.0.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable clype-backend
sudo systemctl start clype-backend

# Check status
sudo systemctl status clype-backend

# View logs
sudo journalctl -u clype-backend -f
```

### Step 6: Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/clype`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=5r/s;

# WebSocket upgrade map
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name ec2-3-87-123-45.compute-1.amazonaws.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ec2-3-87-123-45.compute-1.amazonaws.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/ec2-3-87-123-45.compute-1.amazonaws.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ec2-3-87-123-45.compute-1.amazonaws.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://your-app.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # WebSocket proxy
    location /ws {
        limit_req zone=ws_limit burst=10 nodelay;
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        proxy_buffering off;
    }

    # REST API proxy
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /actuator/health {
        proxy_pass http://localhost:8080;
        access_log off;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/clype /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Setup SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo systemctl stop nginx
sudo certbot certonly --standalone \
  -d ec2-3-87-123-45.compute-1.amazonaws.com \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com

sudo systemctl start nginx

# Setup auto-renewal
echo "0 0,12 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab
```

### Step 8: Configure Coturn (TURN Server)

Edit `/etc/turnserver.conf`:

```conf
listening-port=3478
listening-ip=0.0.0.0
external-ip=3.87.123.45/172.31.XX.XX  # Replace with your IPs
relay-ip=172.31.XX.XX

fingerprint
lt-cred-mech
user=clypeuser:YOUR_TURN_PASSWORD  # From .env
realm=ec2-3-87-123-45.compute-1.amazonaws.com

tls-listening-port=5349
cert=/etc/letsencrypt/live/ec2-3-87-123-45.compute-1.amazonaws.com/fullchain.pem
pkey=/etc/letsencrypt/live/ec2-3-87-123-45.compute-1.amazonaws.com/privkey.pem

min-port=49152
max-port=65535

verbose
log-file=/var/log/turnserver.log

max-bps=500000
bps-capacity=2000000

no-multicast-peers
no-cli
no-loopback-peers

denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
```

Start Coturn:
```bash
sudo systemctl restart coturn
sudo systemctl enable coturn
```

### Step 9: Verify Backend

```bash
# Test API
curl https://ec2-3-87-123-45.compute-1.amazonaws.com/actuator/health

# Should return: {"status":"UP"}

# Test WebSocket (install wscat if needed: npm install -g wscat)
wscat -c wss://ec2-3-87-123-45.compute-1.amazonaws.com/ws
```

## 🌐 Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Update OAuth 2.0 Client:
   - **Authorized JavaScript origins:**
     ```
     https://your-app.vercel.app
     https://ec2-3-87-123-45.compute-1.amazonaws.com
     ```
   - **Authorized redirect URIs:**
     ```
     https://your-app.vercel.app/login
     https://your-app.vercel.app/dashboard
     https://ec2-3-87-123-45.compute-1.amazonaws.com/api/auth/google/desktop
     ```

### Step 2: Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project" → Select your GitHub repository
4. **Configure:**
   - Framework: Next.js
   - Root Directory: `./` (or your frontend folder)
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   NEXT_PUBLIC_API_URL=https://ec2-3-87-123-45.compute-1.amazonaws.com
   NEXT_PUBLIC_WS_URL=wss://ec2-3-87-123-45.compute-1.amazonaws.com/ws
   ```

6. Click "Deploy"

### Step 3: Update Backend CORS

Update Nginx config on EC2 with your Vercel URL:

```nginx
add_header Access-Control-Allow-Origin "https://your-app.vercel.app" always;
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

## 🔄 Part 3: CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build JAR
        run: |
          cd backend
          mvn clean package -DskipTests
      
      - name: Deploy to EC2
        env:
          SSH_KEY: ${{ secrets.EC2_SSH_KEY }}
          EC2_HOST: ${{ secrets.EC2_HOST }}
        run: |
          echo "$SSH_KEY" > key.pem
          chmod 600 key.pem
          scp -i key.pem -o StrictHostKeyChecking=no \
            backend/target/*.jar ubuntu@$EC2_HOST:/opt/clype/
          ssh -i key.pem ubuntu@$EC2_HOST \
            'sudo systemctl restart clype-backend'

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Required GitHub Secrets:**
- `EC2_SSH_KEY` - Content of `clype-key.pem`
- `EC2_HOST` - EC2 public DNS
- `VERCEL_TOKEN` - From vercel.com/account/tokens
- `VERCEL_ORG_ID` - From `.vercel/project.json`
- `VERCEL_PROJECT_ID` - From `.vercel/project.json`

## 🔍 Part 4: Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl https://ec2-XX.compute-1.amazonaws.com/actuator/health

# View backend logs
ssh -i clype-key.pem ubuntu@ec2-XX.compute-1.amazonaws.com
sudo journalctl -u clype-backend -f

# MongoDB stats
mongosh
use clype
db.stats()
db.messages.countDocuments()
```

### AWS CloudWatch (Optional)

1. Install CloudWatch agent on EC2
2. Monitor:
   - CPU utilization
   - Memory usage
   - Network in/out
   - Disk I/O

### Backup Strategy

```bash
# MongoDB backup script: /opt/clype/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://clyuser:password@localhost:27017/clype" \
  --gzip --archive=/opt/clype/backups/backup_$DATE.gz

# Keep only last 7 days
find /opt/clype/backups -name "backup_*.gz" -mtime +7 -delete

# Add to crontab
0 2 * * * /opt/clype/backup.sh
```

## 📊 Cost Breakdown (AWS Free Tier)

**First Year (Free Tier):**
- EC2 t2.micro: $0 (750 hrs/month free)
- EBS 30GB: $0 (included)
- Data Transfer: $0 (first 100GB free)
- **Total: $0/month**

**After First Year:**
- EC2 t2.micro: $8.35/month
- EBS 30GB: $3.00/month
- Data Transfer (50GB): $0 (first 100GB free)
- **Total: ~$12/month**

**Vercel:**
- Free tier: Unlimited deployments
- Bandwidth: 100GB/month free

## 🚨 Troubleshooting

### Backend won't start
```bash
sudo journalctl -u clype-backend -n 100
# Check MongoDB connection
# Check environment variables
# Check port 8080 not in use
```

### SSL certificate issues
```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

### WebSocket connection fails
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test WebSocket
wscat -c wss://your-domain.com/ws
```

### TURN server not working
```bash
sudo systemctl status coturn
sudo journalctl -u coturn -f

# Test TURN: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
```

## ✅ Production Checklist

- [ ] EC2 instance created and accessible
- [ ] Java 17 installed
- [ ] MongoDB installed with authentication
- [ ] Backend JAR deployed
- [ ] Systemd service configured and running
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained and auto-renewing
- [ ] Coturn installed and configured
- [ ] Security groups configured correctly
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set (frontend & backend)
- [ ] Google OAuth configured with production URLs
- [ ] CORS configured correctly
- [ ] CI/CD pipeline configured (optional)
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Tested end-to-end (chat, voice, video)

Your production Clype instance is now live! 🎉
