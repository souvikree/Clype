# Deployment Guide - Clype

Complete guide for deploying Clype to production environments.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker & Docker Compose installed
- MongoDB (included in docker-compose)
- Google OAuth credentials

### Deploy with Docker Compose

1. **Clone and navigate to project**
   ```bash
   git clone <repo>
   cd terminal-chat
   ```

2. **Create .env file**
   ```bash
   cat > .env << EOF
   JWT_SECRET=$(openssl rand -base64 32)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   EOF
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Verify services**
   ```bash
   docker-compose ps
   
   # Frontend: http://localhost:3000
   # Backend: http://localhost:8080/api
   # MongoDB: localhost:27017
   ```

5. **View logs**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

## 🌐 Cloud Deployment

### (Frontend)

1. **Connect GitHub repository**
   - Select your Git repository
   - Select "Next.js" as framework

2. **Configure environment variables**
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-prod-client-id
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws
   ```

3. **Deploy**
   - Vercel automatically builds and deploys on push
   - Check https://yourapp.vercel.app

### AWS (Backend + MongoDB)

#### Option 1: Elastic Beanstalk (Easiest)

1. **Package backend**
   ```bash
   cd backend
   mvn clean package -DskipTests
   ```

2. **Create Elastic Beanstalk app**
   ```bash
   eb create terminal-chat-env \
     --instance-type t3.small \
     --platform "Java 17 running on 64bit Amazon Linux 2"
   ```

3. **Set environment variables**
   ```bash
   eb setenv \
     MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/terminal_chat \
     JWT_SECRET=<production-secret> \
     GOOGLE_CLIENT_ID=<client-id> \
     GOOGLE_CLIENT_SECRET=<client-secret>
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

#### Option 2: ECS (Fargate)

1. **Push Docker image to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag terminal-chat-backend:latest \
     <account-id>.dkr.ecr.us-east-1.amazonaws.com/terminal-chat-backend:latest
   
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/terminal-chat-backend:latest
   ```

2. **Create ECS Task Definition**
   - Use Fargate launch type
   - Set container image to ECR URL
   - Configure environment variables
   - Set port 8080

3. **Create ECS Service**
   - Use Application Load Balancer
   - Enable auto-scaling (min: 2, max: 4)

### DigitalOcean (Full Stack)

1. **Create Droplet**
   ```bash
   doctl compute droplet create terminal-chat \
     --size s-2vcpu-4gb \
     --image ubuntu-22-04-x64 \
     --region nyc3
   ```

2. **SSH into droplet and install Docker**
   ```bash
   apt update && apt upgrade -y
   apt install docker.io docker-compose git -y
   usermod -aG docker $USER
   ```

3. **Clone and deploy**
   ```bash
   git clone <repo> terminal-chat
   cd terminal-chat
   
   # Create .env
   nano .env
   
   # Start services
   docker-compose up -d
   ```

4. **Setup Nginx reverse proxy**
   ```bash
   apt install nginx certbot python3-certbot-nginx -y
   
   # Create nginx config
   cat > /etc/nginx/sites-available/terminal-chat << 'EOF'
   upstream backend {
       server localhost:8080;
   }
   
   upstream frontend {
       server localhost:3000;
   }
   
   server {
       listen 80;
       server_name yourdomain.com;
       
       location /api {
           proxy_pass http://backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /ws {
           proxy_pass http://backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
       
       location / {
           proxy_pass http://frontend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   EOF
   
   # Enable site
   ln -s /etc/nginx/sites-available/terminal-chat /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   
   # Setup SSL
   certbot --nginx -d yourdomain.com
   ```

## 🗄️ MongoDB Setup

### Atlas (Recommended for production)

1. **Create cluster**
   - Go to mongodb.com/cloud
   - Create account and cluster
   - Whitelist IP addresses

2. **Get connection string**
   ```
   mongodb+srv://user:password@cluster.mongodb.net/terminal_chat?retryWrites=true&w=majority
   ```

3. **Set TTL indexes**
   ```javascript
   use terminal_chat;
   
   // Auto-delete messages after 24 hours
   db.messages.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
   
   // Auto-delete sessions after 60 minutes
   db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
   ```

### Self-Hosted (Advanced)

1. **Create MongoDB replica set** (required for transactions)
   ```bash
   # Start 3 mongod instances
   mongod --replSet rs0 --port 27017 &
   mongod --replSet rs0 --port 27018 &
   mongod --replSet rs0 --port 27019 &
   
   # Initialize replica set
   mongosh
   > rs.initiate({
      _id: "rs0",
      members: [
        {_id: 0, host: "localhost:27017"},
        {_id: 1, host: "localhost:27018"},
        {_id: 2, host: "localhost:27019"}
      ]
    })
   ```

2. **Create indexes**
   ```javascript
   db.messages.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
   db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
   ```

## 🔐 Production Security

### SSL/TLS Certificate
```bash
# Use Let's Encrypt with Certbot
certbot certonly --standalone -d yourdomain.com

# Renew automatically
certbot renew --quiet && systemctl restart nginx
```

### Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Database Security
```javascript
// Create admin user
db.createUser({
  user: "admin",
  pwd: "strong-password-here",
  roles: ["dbOwner"]
});

// Create app user (limited permissions)
db.createUser({
  user: "app",
  pwd: "app-password-here",
  roles: ["readWrite"]
});
```

### Environment Variables
```bash
# Backend production secrets
JWT_SECRET=64-character-random-string
GOOGLE_CLIENT_ID=prod-client-id
GOOGLE_CLIENT_SECRET=prod-secret
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/terminal_chat
```

## 📊 Monitoring & Logging

### Docker Compose Logging
```bash
# View all logs
docker-compose logs --tail=100 -f

# View specific service
docker-compose logs -f backend

# Save logs to file
docker-compose logs > logs.txt
```

### Application Monitoring
1. **Backend health check**
   ```bash
   curl http://localhost:8080/api/auth/me \
     -H "Authorization: Bearer <token>"
   ```

2. **MongoDB monitoring**
   ```bash
   docker-compose exec mongodb mongosh
   > db.stats()
   > db.sessions.countDocuments()
   ```

3. **Frontend health**
   ```bash
   curl http://localhost:3000
   ```

## 🔄 Continuous Deployment

### GitHub Actions (Auto-deploy on push)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          vercel --token $VERCEL_TOKEN --prod
      
      - name: Deploy to AWS Elastic Beanstalk
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          pip install awsebcli
          eb deploy production-env
```

## 🆘 Troubleshooting Deployment

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - MongoDB not running: docker-compose logs mongodb
# - Port 8080 in use: lsof -i :8080
# - Missing environment variables: docker-compose config
```

### Frontend can't connect to backend
```bash
# Check NEXT_PUBLIC_API_URL
# Verify backend is running: curl http://localhost:8080/api/auth/me
# Check CORS settings in SecurityConfig.java
# Verify WebSocket connection: wscat -c ws://localhost:8080/ws/chat
```

### MongoDB connection issues
```bash
# Test connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/terminal_chat"

# Check MongoDB URI format
# Ensure whitelist IP is enabled in MongoDB Atlas
```

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] Google OAuth credentials valid
- [ ] MongoDB initialized with TTL indexes
- [ ] SSL/TLS certificate installed
- [ ] Firewall configured correctly
- [ ] CORS origins updated for production domain
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Performance optimized
- [ ] Security audit completed

## 📈 Scaling for Production

### Load Balancing
```bash
# Use AWS ALB or Nginx load balancer
# Point multiple backend instances
upstream backend {
    server backend-1:8080;
    server backend-2:8080;
    server backend-3:8080;
}
```

### Database Scaling
- Use MongoDB Atlas auto-scaling
- Enable sharding for collections > 1GB
- Configure read replicas for high availability

### Frontend Optimization
- Enable CDN (Cloudflare, Cloudfront)
- Setup image optimization
- Configure caching headers

## 🔄 Rollback Procedure

### Quick Rollback
```bash
# Using Docker Compose
docker-compose stop backend
docker pull <registry>/terminal-chat-backend:previous-tag
docker-compose up -d

# Using Vercel
vercel rollback
```

---

For questions or issues, refer to main README.md or open an issue on GitHub.
