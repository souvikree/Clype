# Clype - Architecture & Design Document

## 🏗️ System Overview

Clype is a privacy-first, real-time communication platform designed for gamers and tech users. The architecture follows a clear separation between frontend (Next.js), backend (Spring Boot), and database (MongoDB) with WebRTC for P2P media.

## 🔄 High-Level Flow

```
User 1                    Backend                      User 2
│                           │                           │
├─ Login ──────────────────>│ Verify Google OAuth       │
│                           │ Issue JWT Token           │
│                           │<────────────────────────┐ │
│ Store Token (Zustand)     │                        │ │
│                           │                        │ │
│ Open Terminal Workspace   │                        │ │
│                           │                        │ │
│ my-address ───────────────>│ Generate Code: X7K2A9 │ │
│<──────────────────────────│ Store Session + TTL   │ │
│                           │                        │ │
│        (Share code out-of-band)                    │ │
│                           │                        │ │
│                           │<─────────────── Login──┤ │
│                           │                        │ │
│                           │ Create Code: M3P8Q1    │ │
│                           │ Store Session + TTL    │ │
│                           │ ────────────────────>  │ │
│                           │                        │ │
│ connect-mate M3P8Q1 ─────>│ Validate Sessions      │ │
│                           │ Create Room: R_9123    │ │
│                           │ Bind WebSockets        │ │
│ (WebSocket Connected)     │ (WebSocket Connected)> │ │
│                           │ ─────────────────────> │ │
│                           │                        │ │
│ Hello Friend ────────────>│ Message: {             │ │
│ (via WebSocket)           │   roomId: R_9123      │ │
│                           │   sender: User 1      │ │
│                           │   content: Hello...   │ │
│                           │   ttl: 24h             │ │
│                           │ }                      │ │
│                           │ Store in MongoDB       │ │
│                           │ ────────────────────>  │ │
│                           │ Forward to User 2      │ │
│                           │                        │ │
│<─ Typing Indicator ───────┤ (via WebSocket)       │ │
│<─ Hello back ─────────────┤<─ Message from User 2 │ │
│                           │                        │ │
│ (Chat continues)          │ (Messages auto-delete) │ │
│                           │ (after 24 hours)       │ │
│                           │                        │ │
│ exit-chat ────────────────>│ Close Room             │ │
│                           │ Mark as CLOSED         │ │
│ (WebSocket Disconnected)  │<─────────────────────  │
│                           │ (WebSocket Disconnected)
```

## 🗂️ Project Structure

### Frontend Architecture (Next.js)

```
app/
├── layout.tsx                  # Root layout + metadata
├── page.tsx                    # Home redirect
├── login/
│   └── page.tsx               # Google OAuth login
├── dashboard/
│   └── page.tsx               # Post-auth dashboard with display name
├── workspace/
│   └── page.tsx               # Terminal workspace entry
└── globals.css                # Design tokens & Tailwind config

components/
├── auth/
│   └── google-login.tsx       # Google sign-in button
├── terminal/
│   ├── terminal-workspace.tsx # Main workspace container
│   ├── terminal-tab-bar.tsx   # Dynamic tabs + dropdown
│   ├── terminal-editor.tsx    # Individual tab logic
│   ├── terminal-display.tsx   # Terminal output display
│   └── terminal-input.tsx     # Command input
└── ui/                        # shadcn/ui components

lib/
├── auth-store.ts             # Zustand auth state
├── terminal-store.ts         # Zustand terminal state
├── websocket-client.ts       # STOMP WebSocket wrapper
└── webrtc-client.ts          # WebRTC peer connection
```

### Backend Architecture (Spring Boot)

```
com.terminalchat/
├── TerminalChatBackendApplication.java  # Main entry
│
├── domain/
│   ├── entity/               # MongoDB documents
│   │   ├── User.java
│   │   ├── Session.java
│   │   ├── Room.java
│   │   └── Message.java
│   ├── dto/                  # Data transfer objects
│   │   ├── AuthResponse.java
│   │   ├── SessionCodeResponse.java
│   │   └── MessageDTO.java
│   └── repository/           # Data access layer
│       ├── UserRepository.java
│       ├── SessionRepository.java
│       ├── RoomRepository.java
│       └── MessageRepository.java
│
├── service/                  # Business logic
│   ├── AuthService.java      # User authentication
│   ├── SessionService.java   # Session management
│   ├── RoomService.java      # Room lifecycle
│   ├── MessageService.java   # Message persistence
│   └── PairingService.java   # Code-based pairing
│
├── web/                      # REST controllers
│   ├── AuthController.java
│   ├── RoomController.java
│   └── HealthController.java
│
├── websocket/                # WebSocket handlers
│   ├── ChatWebSocketHandler.java      # STOMP chat
│   └── SignalingWebSocketHandler.java # WebRTC signaling
│
├── security/                 # Authentication & security
│   ├── JwtTokenProvider.java
│   └── JwtAuthenticationFilter.java
│
├── config/                   # Spring configurations
│   ├── WebSocketConfig.java
│   ├── SecurityConfig.java
│   ├── MongoDBConfig.java
│   └── CorsConfigurationSource.java
│
└── scheduler/                # Scheduled tasks
    └── SessionCleanupScheduler.java

resources/
└── application.yml           # Spring Boot config
```

## 🔐 Security Architecture

### Authentication Flow

```
1. User initiates Google OAuth flow
   └─> Frontend: useGoogleLogin()
       └─> Google: Returns ID token
           └─> Decode JWT: googleId, email, name, picture

2. Send to backend with decoded info
   └─> POST /api/auth/google-login
       └─> Request: { googleId, email, displayName, profilePicture }
           └─> Response: { token, userId, ... }

3. Backend creates JWT
   └─> JwtTokenProvider.generateToken(userId, email)
       └─> Claims: { sub: userId, email: email, iat, exp }
           └─> Sign with HS512 + secret key

4. Frontend stores JWT
   └─> Zustand auth-store
       └─> localStorage (persisted)
           └─> Every API request: Authorization: Bearer <token>

5. Backend validates JWT
   └─> JwtAuthenticationFilter
       └─> Extract from Authorization header
           └─> JwtTokenProvider.validateToken(token)
               └─> Verify signature + expiry
                   └─> Extract userId
                       └─> Set SecurityContext
```

### Room Authorization

```
When user sends message to room:
1. Authenticate JWT → get userId
2. Validate user is participant in room
   └─> Room.getParticipantIds().contains(userId)
3. If valid → process message
4. If invalid → reject with 403 Forbidden
```

### Message Privacy

```
Ephemeral Storage Pattern:
1. Message saved with expiresAt = now + 24 hours
2. MongoDB TTL index: db.messages.createIndex({ expiresAt: 1 })
3. MongoDB daemon checks every 60 seconds
4. Auto-deletes expired documents
5. No manual cleanup needed
```

## 📡 WebSocket Protocol

### Connection Lifecycle

```
Frontend                        Backend
  │                               │
  ├─ Connect: ws://localhost:8080/ws/chat
  │                               │
  ├─ (Initializes STOMP client)   │
  │                               │
  ├─ CONNECT frame ──────────────>│
  │   headers: {Authorization: Bearer <token>}
  │                               │
  │<────────────────── CONNECTED frame (receipt: 1)
  │                               │
  │ (Connection established)      │
```

### Chat Message Flow

```
Sender                          Room Service              Receiver
  │                                  │                       │
  │ Send: /app/chat/send/R_9123     │                       │
  │ { senderId, content }           │                       │
  │────────────────────────────────>│                       │
  │                                  │                       │
  │                      Validate authorization              │
  │                      Save to MongoDB with TTL            │
  │                      Broadcast to subscribers             │
  │                                  │─────────────────────> │
  │                                  │  MESSAGE frame        │
  │                                  │ /room/R_9123/messages │
  │                                  │                       │
  │                                  │ (Display in terminal) │
```

### WebRTC Signaling Flow

```
Peer 1                    Signaling Server              Peer 2
  │                              │                        │
  │ SDP Offer ────────────────> │                        │
  │ /app/signaling/offer        │                        │
  │                              │                        │
  │                              │ Broadcast to room     │
  │                              │────────────────────> │
  │                              │                  Create Answer
  │                              │                        │
  │                              │ <─ SDP Answer         │
  │<────────────────────────────────┐                   │
  │ Create Peer Connection          │                   │
  │                                 │                   │
  │ ICE Candidate ────────────────> │                   │
  │                                 │ ───────────────> │
  │                                 │                   │
  │<─────────────────────────────────── ICE Candidate   │
  │                                 │                   │
  │ (P2P encrypted media stream established)            │
  │ ═════════════════════════════════════════════════> │
  │ <═════════════════════════════════════════════════ │
```

## 💾 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  googleId: String (unique),
  email: String (unique),
  displayName: String,
  profilePicture: String,
  createdAt: ISODate,
  updatedAt: ISODate,
  lastLogin: ISODate,
  active: Boolean
}
```

### Sessions Collection
```javascript
{
  _id: ObjectId,
  userId: String,
  sessionCode: String (6 chars, e.g., "X7K2A9"),
  sessionType: String ("CHAT" | "VOICE" | "VIDEO"),
  roomId: String (optional, populated after pairing),
  status: String ("WAITING" | "ACTIVE" | "COMPLETED" | "EXPIRED"),
  createdAt: ISODate,
  expiresAt: ISODate (TTL - MongoDB auto-deletes)
}

// TTL Index:
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

### Rooms Collection
```javascript
{
  _id: ObjectId,
  roomType: String ("CHAT" | "VOICE" | "VIDEO"),
  status: String ("ACTIVE" | "CLOSED" | "EXPIRED"),
  participantIds: [String, String],  // 2 participants
  createdAt: ISODate,
  expiresAt: ISODate,
  closedAt: ISODate
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  roomId: String,
  senderId: String,
  senderUsername: String,
  content: String,
  type: String ("TEXT" | "SYSTEM"),
  createdAt: ISODate,
  expiresAt: ISODate (TTL - auto-deletes after 24h)
}

// TTL Index:
db.messages.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

## 🔄 State Management

### Frontend State (Zustand)

**auth-store.ts**
```typescript
interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login(...): Promise<void>
  logout(): void
  updateDisplayName(...): Promise<void>
}
```

**terminal-store.ts**
```typescript
interface TerminalStore {
  tabs: TerminalTab[]
  activeTabId: string | null
  addTab(type): void
  removeTab(id): void
  setActiveTab(id): void
  addLine(tabId, line): void
  setCommandInput(tabId, input): void
}
```

## 🎯 Command Processing

### Chat Commands

```
my-address
  └─> Generate 6-char code
      └─> POST /api/rooms/my-address/chat
          └─> Create session with status: WAITING
              └─> Return { sessionCode, sessionId }

connect-mate <code>
  └─> Parse code from input
      └─> POST /api/rooms/connect/<code>
          └─> Validate mate's session exists
              └─> Create room with both participants
                  └─> Update both sessions: status = ACTIVE
                      └─> Return { roomId }

help
  └─> Display available commands

exit-chat
  └─> Close WebSocket
      └─> Mark room as CLOSED
          └─> Clear tab
```

### Voice/Video Commands

```
create-voice-call
  └─> POST /api/rooms/my-address/voice
      └─> Similar to chat code generation

open-voice <code>
  └─> Similar to connect-mate for voice

confirm-voice
  └─> Initiate WebRTC handshake
      └─> STUN/TURN for NAT traversal
          └─> P2P audio stream
```

## 🚀 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer** (Nginx, HAProxy)
   - Route requests across multiple backend instances
   - Sticky sessions for WebSocket connections
   - SSL termination

2. **Backend Instances**
   - Multiple Spring Boot instances
   - Share JWT secret key
   - Point to same MongoDB

3. **Database**
   - MongoDB replica set for HA
   - Sharding for >1GB collections
   - Atlas auto-scaling

### Performance Optimizations

1. **Message Pagination**
   - Limit initial load (last 50 messages)
   - Lazy load on scroll

2. **WebSocket Optimization**
   - Connection pooling
   - Heartbeat configuration
   - Reconnection strategy

3. **Database**
   - Compound indexes for queries
   - Connection pooling
   - Query optimization

## 🔧 Error Handling

### Frontend Error Flow

```
Try {
  API call / WebSocket message
} Catch (error) {
  Display error in terminal: [ERROR] message
  Log to console for debugging
  Suggest retry action
}
```

### Backend Error Response

```
400 Bad Request
  └─> Invalid input, missing fields

401 Unauthorized
  └─> No JWT or invalid JWT

403 Forbidden
  └─> User not authorized for resource

404 Not Found
  └─> Room/Session doesn't exist

500 Internal Server Error
  └─> Unexpected server error, check logs
```

## 📊 Monitoring & Logging

### Backend Logging

```
DEBUG: Method entry/exit
INFO: Authentication, room creation, message save
WARN: Unusual activity, slow queries
ERROR: Exceptions, failed operations
```

### Frontend Logging

```
console.log("[Clype] ...") for debugging
Error boundaries for React errors
WebSocket event logging
```

### Database Monitoring

```
MongoDB Profiler: Slow query logs
Connection pooling stats
Replication lag (if replica set)
TTL cleanup success
```

## 🎓 Development Workflow

1. **Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Local Testing**
   - Test in dev environment
   - Check terminal output
   - Verify WebSocket messages

3. **Code Review**
   - PR with description
   - Run CI/CD tests
   - Deploy to staging

4. **Production Release**
   - Merge to main
   - Auto-deploy via CI/CD
   - Monitor logs

---

This architecture ensures privacy, security, and performance while maintaining a clean code structure for future scalability.
