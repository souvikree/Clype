# Clype - Production-Grade Real-Time Communication Platform

A command-driven, terminal-style communication platform with real-time chat, voice calls, and video calls using a privacy-first, code-based pairing system. Built for gamers and tech users who value privacy.

## 🎯 Features

- **Terminal UI**: Command-driven interface with Chrome/Arc-style dynamic tabs
- **Privacy-First**: No account linking required, code-based pairing system
- **Real-Time Chat**: WebSocket-powered instant messaging with ephemeral storage (24h TTL)
- **Voice & Video**: P2P encrypted calls using WebRTC with STUN/TURN support
- **Desktop App**: Electron wrapper for Windows with auto-start backend
- **Gamer Aesthetic**: RGB neon design with smooth animations
- **Secure**: JWT authentication, encrypted P2P media, no cloud storage of media

## 🛠 Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Zustand** (state management)
- **WebSocket** (STOMP client)
- **WebRTC** (P2P media)
- **React 19**
- **Electron** (desktop wrapper)

### Backend
- **Java 17**
- **Spring Boot 3.2**
- **Spring WebSocket** (STOMP)
- **MongoDB** (TTL indexes for auto-cleanup)
- **JWT** (stateless auth)
- **Google OAuth 2.0**

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│               Electron Desktop App                      │
│  ┌────────────────────────────────────────────────┐    │
│  │         Next.js Frontend (Port 3000)           │    │
│  │  - Terminal Workspace with Dynamic Tabs        │    │
│  │  - Tab System (Chat, Voice, Video)             │    │
│  │  - WebRTC Client Integration                   │    │
│  │  - Google OAuth Login                          │    │
│  └────────────────────────────────────────────────┘    │
│                         │                               │
│  WebSocket (STOMP)     │     WebRTC (P2P)             │
│  JWT Auth             │     Encrypted Media          │
└──────────────┬────────┼────────────────────────────────┘
               │        │
      ┌────────▼────────▼──────────────┐
      │   Spring Boot Backend (8080)    │
      │  ┌──────────────────────────┐  │
      │  │ Auth Service             │  │
      │  │ - Google OAuth           │  │
      │  │ - JWT Token Generation   │  │
      │  └──────────────────────────┘  │
      │  ┌──────────────────────────┐  │
      │  │ Room Manager             │  │
      │  │ - Code Pairing           │  │
      │  │ - Room Lifecycle         │  │
      │  │ - Participant Tracking   │  │
      │  └──────────────────────────┘  │
      │  ┌──────────────────────────┐  │
      │  │ WebSocket Handlers       │  │
      │  │ - Chat Messaging         │  │
      │  │ - WebRTC Signaling       │  │
      │  │ - ICE Candidate Exchange │  │
      │  └──────────────────────────┘  │
      │  ┌──────────────────────────┐  │
      │  │ MongoDB Integration       │  │
      │  │ - User Persistence       │  │
      │  │ - Ephemeral Messages     │  │
      │  │ - TTL Cleanup            │  │
      │  └──────────────────────────┘  │
      └─────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- MongoDB 5.0+
- Google OAuth credentials

### Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Configure:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `NEXT_PUBLIC_API_URL`: Backend URL (default: `http://localhost:8080/api`)
   - `NEXT_PUBLIC_WS_URL`: WebSocket URL (default: `ws://localhost:8080/ws`)

3. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   mvn clean install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Configure:
   - `MONGODB_URI`: MongoDB connection string
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: OAuth credentials
   - `JWT_SECRET`: Strong random string (32+ chars)

3. **Run Spring Boot**
   ```bash
   mvn spring-boot:run
   ```
   
   Server runs on `http://localhost:8080`

### Database Setup

MongoDB will auto-create collections with TTL indexes:

```javascript
// Messages collection - auto-deletes after 24 hours
db.messages.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })

// Sessions collection - auto-deletes after 60 minutes
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

## 📖 Usage Flow

### Authentication
1. User opens app → redirected to Google Login
2. Google OAuth callback → JWT token issued
3. Token stored in Zustand + localStorage
4. Token sent in `Authorization: Bearer <token>` header

### Chat Session
```
User A:
> my-address
Server generates code: X7K2A9

User A shares code with User B out-of-band

User B:
> connect-mate X7K2A9

Server:
- Validates both users have pending sessions
- Creates Room R_9123
- Binds WebSocket connections
- Switches both to Chat mode

Message flow:
User A types → Terminal UI → WebSocket → Room Service → WebSocket → User B Terminal
```

### Voice/Video Call
```
1. User A: create-voice-call → Server generates code + signaling room
2. User A shares code
3. User B: open-voice <code>
4. Server places both in signaling room
5. Both: confirm-voice
6. WebRTC signaling begins:
   - SDP Offer/Answer
   - ICE Candidates
   - STUN/TURN traversal
7. Direct P2P encrypted audio/video channel established

Server NEVER sees media - only signaling
```

## 🏗 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home (redirects to auth)
│   ├── login/               # Google OAuth login
│   ├── dashboard/           # Post-auth dashboard
│   ├── workspace/           # Terminal workspace
│   └── globals.css          # Design tokens & Tailwind
├── components/
│   ├── auth/                # Authentication components
│   ├── terminal/            # Terminal UI components
│   │   ├── terminal-workspace.tsx
│   │   ├── terminal-tab-bar.tsx
│   │   ├── terminal-editor.tsx
│   │   ├── terminal-display.tsx
│   │   └── terminal-input.tsx
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth-store.ts        # Zustand auth store
│   ├── terminal-store.ts    # Zustand terminal state
│   ├── websocket-client.ts  # WebSocket client
│   └── webrtc-client.ts     # WebRTC client
└── public/                  # Static assets

backend/
├── src/main/java/com/terminalchat/
│   ├── domain/
│   │   ├── entity/          # JPA/MongoDB entities
│   │   ├── dto/             # Data transfer objects
│   │   └── repository/      # Data access layer
│   ├── service/             # Business logic
│   ├── web/                 # REST controllers
│   ├── websocket/           # WebSocket handlers
│   ├── security/            # JWT & auth
│   ├── config/              # Spring configuration
│   └── TerminalChatBackendApplication.java
├── src/main/resources/
│   └── application.yml      # Spring Boot config
└── pom.xml                  # Maven configuration
```

## 🔐 Security

### Authentication
- Google OAuth 2.0 for initial login
- JWT tokens with 24-hour expiration
- Token stored securely (Zustand + localStorage)
- Stateless auth (no session storage)

### Communication
- WebSocket connections require valid JWT
- Room participation validated server-side
- WebRTC media encrypted end-to-end
- No media stored on server
- Message TTL: 24 hours (auto-deleted)
- Session TTL: 60 minutes (auto-deleted)

### Input Validation
- Server-side validation on all endpoints
- Parameterized queries (MongoDB prevents injection)
- CORS protection with specific origins
- Rate limiting recommended for production

## 🚀 Production Deployment

### Frontend 
```bash
npm run build
# Deploy to Vercel
```

### Backend (AWS/DigitalOcean/Self-hosted)
```bash
mvn clean package -DskipTests
java -jar backend/target/backend-1.0.0.jar
```

### Environment Variables (Production)
```
# Frontend (.env.local)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<prod-client-id>
NEXT_PUBLIC_API_URL=https://api.terminalchat.com
NEXT_PUBLIC_WS_URL=wss://api.terminalchat.com/ws

# Backend (application.yml)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/terminal_chat
JWT_SECRET=<64-char-random-string>
GOOGLE_CLIENT_ID=<prod-client-id>
GOOGLE_CLIENT_SECRET=<prod-secret>
```

### TURN Server (for NAT traversal)
```
For production, use TURN server:
- Twilio TURN
- Coturn self-hosted
- AWS ICE Services
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Google OAuth login flows
- [ ] Chat code generation and pairing
- [ ] Message delivery and history
- [ ] Voice call initiation and connection
- [ ] Video call with screen share
- [ ] Tab creation/switching/closing
- [ ] WebSocket reconnection
- [ ] Message TTL cleanup (wait 24h)
- [ ] Session expiry cleanup

### Load Testing
```bash
# Backend load testing
mvn test

# Frontend component tests
npm test
```

## 📝 Database Migrations

### Create TTL Index (MongoDB)
```javascript
// Auto-delete messages after 24 hours
db.messages.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })

// Auto-delete sessions after 60 minutes
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

## 🐛 Common Issues

### WebSocket Connection Refused
- Ensure backend is running on port 8080
- Check `NEXT_PUBLIC_WS_URL` configuration
- Verify CORS settings in `WebSocketConfig.java`

### Google OAuth Not Working
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Check Google Cloud Console authorized origins
- Ensure redirect URI matches exactly

### MongoDB Connection Failed
- Verify MongoDB is running
- Check `MONGODB_URI` format
- Ensure network access if using cloud MongoDB

### WebRTC Audio/Video Not Working
- Check browser permissions for camera/microphone
- Verify STUN servers are reachable
- Check browser console for CORS/security errors

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/google-login
  Body: { googleId, email, displayName, profilePicture }
  Response: { token, userId, email, displayName }

POST /api/auth/update-display-name
  Headers: Authorization: Bearer <token>
  Body: { displayName }
  Response: { id, email, displayName }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Response: { id, email, displayName, profilePicture }
```

### Room Endpoints
```
POST /api/rooms/my-address/{sessionType}
  Headers: Authorization: Bearer <token>
  Response: { sessionCode, sessionId, sessionType }

POST /api/rooms/connect/{mateCode}
  Headers: Authorization: Bearer <token>
  Body: { sessionType, mySessionId }
  Response: { roomId, status, mateUserId }

GET /api/rooms/{roomId}
  Headers: Authorization: Bearer <token>
  Response: { id, roomType, status, participantIds }

POST /api/rooms/{roomId}/close
  Headers: Authorization: Bearer <token>
  Response: { success: true }
```

### WebSocket Endpoints
```
Chat:
  /app/chat/send/{roomId}
  /app/chat/typing/{roomId}
  Subscribe: /room/{roomId}/messages
  Subscribe: /room/{roomId}/typing

Signaling:
  /app/signaling/offer/{roomId}
  /app/signaling/answer/{roomId}
  /app/signaling/ice-candidate/{roomId}
  Subscribe: /room/{roomId}/webrtc-offer
  Subscribe: /room/{roomId}/webrtc-answer
  Subscribe: /room/{roomId}/ice-candidate
```

## 📈 Performance Optimization

- Message pagination for long histories
- Debounce typing indicators
- Lazy load tabs
- WebSocket connection pooling
- MongoDB compound indexes
- Redis caching (optional)

## 🎨 Customization

### Design Tokens (globals.css)
```css
:root {
  --primary: oklch(0.6 0.2 310);      /* Magenta/Purple */
  --accent: oklch(0.6 0.25 185);      /* Cyan/Blue */
  --background: oklch(0.08 0 0);      /* Almost black */
  /* ... */
}
```

### Terminal Colors
Edit `components/terminal/terminal-display.tsx` to customize:
- Prompt color
- Error color
- System message color
- User message color

## 📞 Support

For issues, questions, or contributions:
1. Check existing GitHub issues
2. Create detailed bug report with reproduction steps
3. Include environment info (OS, browser, versions)

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- Spring Boot WebSocket documentation
- Next.js best practices
- WebRTC MDN documentation
- MongoDB TTL indexes
- Google OAuth integration patterns

---

**Made for gamers and tech users who value privacy and control.**

Built with ❤️ using modern, production-grade technologies.
