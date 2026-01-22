# Development Setup Guide - Clype

Complete guide for setting up the development environment locally.

## 📋 Prerequisites

### System Requirements
- **OS**: macOS, Linux, or Windows (WSL2)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space

### Required Software
- **Node.js**: 18.17+ (LTS recommended)
- **npm**: 9.0+
- **Java**: OpenJDK 17+
- **Maven**: 3.8+
- **MongoDB**: 5.0+ or Docker
- **Git**: 2.30+

## 🔧 Installation

### 1. Install Node.js

**macOS (Homebrew)**
```bash
brew install node@18
node --version  # v18.x.x
npm --version   # 9.x.x
```

**Ubuntu/Debian**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows**
- Download from nodejs.org/en/download
- Run installer and follow prompts

### 2. Install Java 17

**macOS (Homebrew)**
```bash
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@17' >> ~/.zshrc
```

**Ubuntu/Debian**
```bash
sudo apt-get install openjdk-17-jdk
java -version
```

**Windows**
- Download from adoptium.net
- Run installer
- Set JAVA_HOME environment variable

### 3. Install Maven

**macOS (Homebrew)**
```bash
brew install maven
mvn -version
```

**Ubuntu/Debian**
```bash
sudo apt-get install maven
mvn -version
```

**Windows**
- Download from maven.apache.org
- Extract to C:\Program Files\apache-maven
- Add to PATH

### 4. Install MongoDB

**Option A: Docker (Recommended)**
```bash
docker pull mongo:7.0
docker run -d -p 27017:27017 --name terminal-chat-mongo mongo:7.0
```

**Option B: Local Installation**

**macOS (Homebrew)**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows**
- Download from mongodb.com/try/download/community
- Run installer
- MongoDB will start as Windows service

### 5. Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project: "Clype"
   - Enable OAuth 2.0 consent screen

2. **Create OAuth 2.0 Credentials**
   - Go to Credentials → Create OAuth 2.0 Client ID
   - Select "Web application"
   - Add authorized origins:
     ```
     http://localhost:3000
     http://localhost:8000
     http://127.0.0.1:3000
     ```
   - Add authorized redirect URIs:
     ```
     http://localhost:3000/login
     http://localhost:3000/dashboard
     ```
   - Save credentials (you'll need Client ID and Secret)

3. **Create service account** (for backend)
   - Go to Service Accounts
   - Create service account for "Clype Backend"
   - Create JSON key file

## 🚀 Frontend Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd terminal-chat
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-from-console
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### 3. Install Dependencies

```bash
npm install

# Additional optional packages
npm install zustand socket.io-client
npm install -D @types/node @types/react
```

### 4. Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### 5. Development Commands

```bash
# Build for production
npm run build

# Start production build locally
npm start

# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## ☕ Backend Setup

### 1. Navigate to Backend

```bash
cd backend
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/terminal_chat
SERVER_PORT=8080
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Generate strong JWT_SECRET:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Max 256)}))
```

### 3. Install Dependencies

```bash
mvn clean install
```

### 4. Create MongoDB Indexes

```bash
# Connect to MongoDB
mongosh

# Switch to database
use terminal_chat

# Create TTL indexes
db.messages.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.users.createIndex({ "googleId": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })

# Verify indexes
db.messages.getIndexes()
```

### 5. Run Spring Boot

```bash
mvn spring-boot:run
```

Server starts at `http://localhost:8080`

### 6. Backend Commands

```bash
# Clean build
mvn clean

# Test
mvn test

# Package JAR
mvn package -DskipTests

# View dependencies
mvn dependency:tree

# Update dependencies
mvn versions:update-properties
```

## 📊 Verify Setup

### 1. Check Backend API

```bash
# Health check
curl http://localhost:8080/api/auth/me

# Should return 401 (no token) - that's expected
```

### 2. Check Frontend

```bash
# Open browser
open http://localhost:3000

# Should see login page
```

### 3. Check MongoDB

```bash
mongosh
> use terminal_chat
> db.users.countDocuments()  # Should return 0 initially
```

### 4. Check WebSocket

```bash
# Install wscat if needed
npm install -g wscat

# Test WebSocket connection
wscat -c ws://localhost:8080/ws/chat

# Should connect successfully
```

## 🛠 IDE Setup

### Visual Studio Code

1. **Install Extensions**
   ```bash
   code --install-extension ms-vscode.vscode-typescript-next
   code --install-extension mhutchie.git-graph
   code --install-extension eamodio.gitlens
   code --install-extension esbenp.prettier-vscode
   code --install-extension dbaeumer.vscode-eslint
   code --install-extension vscjava.extension-pack-for-java
   code --install-extension vmware.vscode-spring-boot
   ```

2. **Settings (settings.json)**
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "[java]": {
       "editor.defaultFormatter": "redhat.java"
     },
     "java.configuration.runtimes": [
       {
         "name": "JavaSE-17",
         "path": "/path/to/java17",
         "default": true
       }
     ]
   }
   ```

### IntelliJ IDEA

1. **Open Project**
   - File → Open → Select backend directory
   - Configure JDK: File → Project Structure → JDK 17

2. **Run Configurations**
   - Run → Edit Configurations
   - Add Spring Boot configuration
   - Main class: `com.terminalchat.TerminalChatBackendApplication`

### WebStorm / IntelliJ JS

1. **Configure Node**
   - Settings → Languages & Frameworks → Node.js
   - Node.js interpreter → Select installed Node 18

2. **Run Configuration**
   - Create Node.js configuration
   - Script: `node_modules/next/dist/bin/next`
   - Arguments: `dev`

## 🐛 Debugging

### Frontend Debugging

```bash
# Use Chrome DevTools
# Open http://localhost:3000
# Press F12 or Ctrl+Shift+I

# VSCode Debugger
# Create .vscode/launch.json:
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Backend Debugging

```bash
# Enable debug mode
export MAVEN_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
mvn spring-boot:run

# Connect IntelliJ:
# Run → Edit Configurations → Add Remote
# Host: localhost, Port: 5005
```

### MongoDB Debugging

```bash
# Monitor operations
mongosh
> use terminal_chat
> db.currentOp()

# View recent queries
> db.system.profile.find().limit(5).pretty()

# Enable profiling
> db.setProfilingLevel(1, { slowms: 100 })
```

## 🔄 Common Development Tasks

### Add NPM Package

```bash
cd frontend
npm install <package-name>
npm install -D <dev-package>
```

### Add Maven Dependency

```bash
# Edit backend/pom.xml and add dependency
# Maven will auto-download on next mvn build
```

### Format Code

```bash
# Frontend
npm run format

# Backend
mvn com.spotify.fmt:fmt-maven-plugin:format
```

### Run Tests

```bash
# Backend tests
cd backend
mvn test

# Frontend tests (if configured)
npm test
```

### Database Reset

```bash
# Drop entire database
mongosh
> use terminal_chat
> db.dropDatabase()

# MongoDB will recreate on next API call with TTL indexes
```

## 📚 File Structure Quick Reference

```
frontend/
├── app/              # Next.js pages and layouts
├── components/       # React components
├── lib/              # Utilities and stores
├── public/           # Static files
└── .env.local        # Environment variables

backend/
├── src/main/java/    # Java source code
├── src/main/resources/ # Configuration files
├── pom.xml           # Maven dependencies
└── .env              # Backend environment
```

## 🆘 Troubleshooting

### npm install fails
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### MongoDB connection refused
```bash
# Check if running
mongosh

# If not, start it
# Docker: docker start terminal-chat-mongo
# Homebrew: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port already in use
```bash
# Find process on port
lsof -i :3000
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different ports
npm run dev -- -p 3001
PORT=8081 mvn spring-boot:run
```

### Google OAuth not working
```bash
# Check credentials
echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Verify in Google Cloud Console:
# - OAuth consent screen configured
# - Credentials created
# - Authorized origins updated
# - Redirect URIs correct
```

### WebSocket connection issues
```bash
# Test connectivity
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:8080/ws/chat

# Check Spring Boot logs for errors
mvn spring-boot:run | grep -i websocket
```

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Java 17 installed
- [ ] Maven installed
- [ ] MongoDB running
- [ ] Google OAuth credentials obtained
- [ ] Frontend .env.local configured
- [ ] Backend .env configured
- [ ] Frontend dependencies installed
- [ ] Backend dependencies installed
- [ ] MongoDB indexes created
- [ ] Frontend server running on port 3000
- [ ] Backend server running on port 8080
- [ ] Can login with Google
- [ ] Can create terminal tabs

## 🎓 Next Steps

1. **Read Documentation**
   - README.md - Project overview
   - DEPLOYMENT.md - Production setup

2. **Explore Codebase**
   - Start with `app/page.tsx` (frontend)
   - Check `TerminalChatBackendApplication.java` (backend)

3. **Try the App**
   - Login with Google
   - Create a chat tab
   - Test command system

4. **Make Changes**
   - Edit files
   - Changes hot-reload (frontend)
   - Restart backend for Java changes

---

Happy coding! For questions, check the README or open an issue.
