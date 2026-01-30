# Clype - Development Guide

Complete guide for setting up Clype locally for development.

## 📋 System Requirements

- **OS:** macOS, Linux, or Windows (with WSL2)
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 10GB free space
- **Node.js:** 18.17+
- **Java:** OpenJDK 17+
- **Maven:** 3.8+
- **MongoDB:** 7.0+
- **Git:** 2.30+

## 🔧 Initial Setup

### 1. Install Node.js

**macOS (Homebrew):**
```bash
brew install node@18
node --version  # Should show v18.x.x
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org) and run installer.

### 2. Install Java 17

**macOS (Homebrew):**
```bash
brew install openjdk@17
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@17' >> ~/.zshrc
source ~/.zshrc
```

**Ubuntu/Debian:**
```bash
sudo apt-get install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

**Windows:**
Download from [adoptium.net](https://adoptium.net) and set `JAVA_HOME` environment variable.

### 3. Install Maven

**macOS:**
```bash
brew install maven
```

**Ubuntu/Debian:**
```bash
sudo apt-get install maven
```

Verify: `mvn -version`

### 4. Install MongoDB

**Option A: Docker (Recommended)**
```bash
docker pull mongo:7.0
docker run -d -p 27017:27017 --name clype-mongo mongo:7.0
```

**Option B: Local Installation**

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Ubuntu:**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
```

### 5. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project: "Clype Dev"
3. Enable APIs: Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     http://localhost:8080
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/login
     http://localhost:3000/dashboard
     ```
5. Save Client ID and Client Secret

## 🚀 Project Setup

### Clone Repository

```bash
git clone <repository-url>
cd clype
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### Backend Setup

```bash
cd backend

# Install dependencies
mvn clean install

# Create environment file
cp .env.example .env
```

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/clype
SERVER_PORT=8080
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-please-change-this
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Generate secure JWT_SECRET:**
```bash
openssl rand -base64 32
```

### Database Initialization

```bash
# Connect to MongoDB
mongosh

# Switch to database
use clype

# Create TTL indexes
db.messages.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.users.createIndex({ "googleId": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })

# Verify indexes
db.messages.getIndexes()

exit
```

## ▶️ Running the Application

### Start Backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`

**Expected output:**
```
Started TerminalChatBackendApplication in 5.234 seconds
```

### Start Frontend (New Terminal)

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

**Expected output:**
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

### Verify Setup

1. **Backend API:** Visit `http://localhost:8080/actuator/health`
   - Should return: `{"status":"UP"}`

2. **Frontend:** Visit `http://localhost:3000`
   - Should see login page

3. **MongoDB:** 
   ```bash
   mongosh
   use clype
   db.users.countDocuments()  # Should return 0 initially
   ```

4. **WebSocket:** Install wscat and test
   ```bash
   npm install -g wscat
   wscat -c ws://localhost:8080/ws
   # Should connect successfully
   ```

## 🛠 Development Workflow

### Hot Reload

- **Frontend:** Changes auto-reload instantly
- **Backend:** Requires restart after Java file changes
  - Stop with `Ctrl+C`
  - Restart with `mvn spring-boot:run`

### Useful Commands

**Frontend:**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

**Backend:**
```bash
mvn spring-boot:run        # Start server
mvn test                   # Run tests
mvn clean package          # Build JAR
mvn dependency:tree        # View dependencies
```

**MongoDB:**
```bash
mongosh                    # Connect to MongoDB
mongosh --eval "db.stats()" # Quick stats
```

## 🧪 Testing

### Manual Testing Flow

1. **Login:** Visit `http://localhost:3000` → Click "Sign in with Google"
2. **Dashboard:** Enter display name → Access workspace
3. **Create Chat Tab:** Click "+" in tab bar
4. **Generate Code:** Type `my-address` → Note the code
5. **Connect (Second Browser):**
   - Open new incognito window
   - Login with different Google account
   - Create chat tab
   - Type `connect-mate YOUR_CODE`
6. **Exchange Messages:** Type and send messages
7. **Test Voice Call:** Type `voice-call TestUser`
8. **Test Video Call:** Type `video-call TestUser`

### Backend Unit Tests

```bash
cd backend
mvn test

# Run specific test class
mvn test -Dtest=AuthServiceTest

# Run with coverage
mvn test jacoco:report
```

### Database Inspection

```bash
mongosh

use clype

# View users
db.users.find().pretty()

# View active sessions
db.sessions.find({ status: "ACTIVE" }).pretty()

# View rooms
db.rooms.find().pretty()

# View messages (last 10)
db.messages.find().sort({ createdAt: -1 }).limit(10).pretty()

# Check TTL cleanup is working
db.messages.find({ expiresAt: { $lt: new Date() } }).count()
```

## 🐛 Debugging

### Frontend Debugging (VS Code)

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Backend Debugging (IntelliJ IDEA)

1. Open `backend` folder in IntelliJ
2. Set breakpoints in code
3. Right-click `TerminalChatBackendApplication.java`
4. Select "Debug 'TerminalChatBackendApplication'"

### Backend Debugging (VS Code)

Run with debug mode:
```bash
export MAVEN_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
mvn spring-boot:run
```

Then in VS Code, create debug configuration:
```json
{
  "type": "java",
  "name": "Attach to Spring Boot",
  "request": "attach",
  "hostName": "localhost",
  "port": 5005
}
```

### MongoDB Debugging

Enable profiling:
```javascript
mongosh
use clype
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().limit(5).pretty()
```

## 🔄 Common Tasks

### Reset Database

```bash
mongosh
use clype
db.dropDatabase()
exit

# Restart backend to recreate indexes
```

### Clear Browser Storage

```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Update Dependencies

**Frontend:**
```bash
npm update
npm outdated  # Check for newer versions
```

**Backend:**
```bash
mvn versions:display-dependency-updates
```

### Generate New JWT Secret

```bash
openssl rand -base64 64
```

Copy output to `backend/.env` `JWT_SECRET` value.

## 🚨 Troubleshooting

### Port Already in Use

**Frontend (3000):**
```bash
lsof -i :3000
kill -9 <PID>
# Or use different port
npm run dev -- -p 3001
```

**Backend (8080):**
```bash
lsof -i :8080
kill -9 <PID>
```

### MongoDB Connection Refused

```bash
# Check if running
mongosh

# If not, start it
# Docker:
docker start clype-mongo

# Homebrew:
brew services start mongodb-community@7.0

# Linux:
sudo systemctl start mongod
```

### Google OAuth Not Working

1. Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`
2. Check Google Cloud Console:
   - Authorized origins include `http://localhost:3000`
   - Redirect URIs include `http://localhost:3000/login`
3. Clear browser cookies and try again

### WebSocket Connection Fails

1. Verify backend is running on port 8080
2. Check `NEXT_PUBLIC_WS_URL` in `.env.local`
3. Test with wscat: `wscat -c ws://localhost:8080/ws`
4. Check browser console for errors

### Build Errors

**Frontend:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

**Backend:**
```bash
# Clean and rebuild
mvn clean
mvn clean install -U
```

## 📁 Project Structure

```
clype/
├── app/                          # Next.js pages
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home (redirects to login)
│   ├── login/page.tsx           # Google OAuth login
│   ├── dashboard/page.tsx       # Post-auth dashboard
│   └── workspace/page.tsx       # Terminal workspace
│
├── components/
│   ├── auth/                    # Authentication components
│   ├── terminal/                # Terminal UI components
│   ├── calls/                   # Voice/video calling components
│   └── ui/                      # shadcn/ui components
│
├── lib/
│   ├── auth-store.ts            # Zustand auth state
│   ├── terminal-store.ts        # Zustand terminal state
│   ├── websocket-client.ts      # WebSocket client
│   └── webrtc-client.ts         # WebRTC client
│
├── backend/
│   └── src/main/java/com/terminalchat/
│       ├── domain/              # Entities, DTOs, repositories
│       ├── service/             # Business logic
│       ├── web/                 # REST controllers
│       ├── websocket/           # WebSocket handlers
│       ├── security/            # JWT authentication
│       ├── config/              # Spring configuration
│       └── TerminalChatBackendApplication.java
│
└── docs/                        # Documentation
```

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [WebRTC Basics](https://webrtc.org/getting-started/overview)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

## ✅ Development Checklist

- [ ] Node.js 18+ installed
- [ ] Java 17 installed
- [ ] Maven installed
- [ ] MongoDB running
- [ ] Google OAuth credentials obtained
- [ ] Frontend `.env.local` configured
- [ ] Backend `.env` configured
- [ ] Dependencies installed (npm + maven)
- [ ] MongoDB indexes created
- [ ] Frontend server running on 3000
- [ ] Backend server running on 8080
- [ ] Can login with Google
- [ ] Can create terminal tabs
- [ ] Can send messages between users
- [ ] Can make voice/video calls

You're now ready to develop Clype! 🚀
