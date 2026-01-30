# Clype - Privacy-First Real-Time Communication Platform

A terminal-style, code-based peer-to-peer communication platform with real-time chat, voice calls, and video calls. Built for users who value privacy and control.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-blue)](https://webrtc.org/)

---

## 🎯 Key Features

### Privacy-First Architecture
- **No Account Linking** - Code-based pairing system, no friend lists
- **Ephemeral Data** - Messages auto-delete after 24 hours
- **P2P Encrypted Media** - Voice and video never touch the server
- **Stateless Auth** - JWT tokens, no session tracking

### Real-Time Communication
- **Instant Messaging** - WebSocket-powered chat with typing indicators
- **Voice Calls** - Crystal-clear P2P audio with WebRTC
- **Video Calls** - HD video (1280x720) with picture-in-picture layout
- **Code-Based Pairing** - Connect via 6-character session codes

### Terminal-Style UX
- **Command-Driven Interface** - PowerShell-inspired terminal UI
- **Dynamic Tab System** - Chrome/Arc-style tab management
- **Color-Coded Output** - Visual distinction for users, system messages, errors
- **Gamer Aesthetic** - RGB neon design with smooth animations

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Java 17+ and Maven 3.8+
- MongoDB 7.0+
- Google OAuth credentials

### Installation

```bash
# Clone repository
git clone <repository-url>
cd clype

# Frontend setup
npm install
cp .env.local.example .env.local
# Edit .env.local with your Google Client ID

# Backend setup
cd backend
mvn clean install
cp .env.example .env
# Edit .env with MongoDB URI and secrets

# Start services
npm run dev          # Frontend on :3000
mvn spring-boot:run  # Backend on :8080
```

### Docker Quick Start

```bash
# Copy environment files
cp .env.local.example .env.local
cp backend/.env.example backend/.env

# Edit both .env files with your credentials

# Start all services
docker-compose up -d

# Access at http://localhost:3000
```

---

## 📖 Usage

### Authentication
1. Click "Sign in with Google"
2. Complete OAuth flow
3. Set your display name
4. Enter workspace

### Chat Session
```bash
# User A: Generate session code
my-address
# Returns: ALPHA-7234K

# User B: Connect with code
connect-mate ALPHA-7234K

# Both users can now chat in real-time
```

### Voice & Video Calls
```bash
# Voice call
## User A: Generate session code
my-address
## Returns: ALPHA-7234K

## User B: Connect with code
connect-mate ALPHA-7234K
Command : call

# Video call
Same as voice call : my-address, connect-mate
Command : call

# Commands work after pairing via connect-mate
```

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **Zustand** for state management
- **WebSocket** (STOMP) for real-time messaging
- **WebRTC** for P2P media

### Backend
- **Spring Boot 3.2** (Java 17)
- **Spring WebSocket** (STOMP protocol)
- **MongoDB 7.0** with TTL indexes
- **JWT** for stateless authentication
- **Google OAuth 2.0** integration

### Infrastructure
- **Docker** for containerization
- **MongoDB Atlas** (production database)
- **Vercel** (frontend hosting)
- **AWS EC2** (backend hosting)
- **Coturn** (TURN server for NAT traversal)

---

## 🔐 Security Features

### Authentication & Authorization
- Google OAuth 2.0 for secure login
- JWT tokens with 24-hour expiration
- Server-side authorization checks
- Room participant validation

### Data Protection
- End-to-end encrypted media (DTLS-SRTP)
- Ephemeral messaging (24-hour TTL)
- Session auto-expiration (60 minutes)
- MongoDB TTL indexes for automatic cleanup
- No media storage on server

### Network Security
- HTTPS/WSS in production
- CORS protection
- Rate limiting (Nginx)
- Input validation and sanitization

---

## 📁 Project Structure

```
clype/
├── app/                    # Next.js pages & layouts
├── components/             # React components
│   ├── auth/              # Authentication UI
│   ├── calls/             # Voice/video call components
│   ├── terminal/          # Terminal workspace UI
│   └── ui/                # Shared UI components
├── lib/                   # Utilities & state management
│   ├── auth-store.ts      # Zustand auth state
│   ├── terminal-store.ts  # Terminal session state
│   ├── websocket-client.ts # WebSocket wrapper
│   └── webrtc-client.ts   # WebRTC peer connection
├── backend/
│   └── src/main/java/com/terminalchat/
│       ├── domain/        # Entities & repositories
│       ├── service/       # Business logic
│       ├── web/           # REST controllers
│       ├── websocket/     # WebSocket handlers
│       ├── security/      # JWT & auth
│       └── config/        # Spring configuration
└── docs/                  # Documentation
```

---

## 🌐 API Overview

### REST Endpoints

```
POST   /api/auth/google-login          # OAuth login
POST   /api/auth/update-display-name   # Update username
GET    /api/auth/me                    # Get current user

POST   /api/rooms/my-address/{type}    # Generate session code
POST   /api/rooms/connect/{code}       # Connect with peer
GET    /api/rooms/{roomId}             # Get room details
POST   /api/rooms/{roomId}/close       # Close room
```

### WebSocket Endpoints

```
/ws/chat         # Real-time chat messaging
/ws/signaling    # WebRTC signaling (offer/answer/ICE)
```

See [API.md](./API.md) for complete API documentation.

---

## 🎨 Terminal Commands

```bash
help                       # Show all available commands
my-address                 # Generate 6-character session code
connect-mate <code>        # Connect with peer using their code
call                       # Initiate voice call & Video Call in Individual Tab (Voice || Video)
exit                       # Close current session
```

---

## 📊 Performance

- **Message Delivery**: <100ms end-to-end
- **WebSocket Latency**: <50ms typical
- **JWT Validation**: <1ms per request
- **MongoDB Queries**: <10ms average
- **Video Quality**: Up to 1280x720 @ 30fps
- **Audio Quality**: 48kHz Opus codec

---

## 🧪 Testing

### Manual Testing Flow

```bash
# Terminal 1 (User A)
1. Login with Google
2. Create chat tab
3. Type: my-address
4. Share code: ALPHA-7234K

# Terminal 2 (User B)  
1. Login with Google
2. Create chat tab
3. Type: connect-mate ALPHA-7234K
4. Send messages back and forth

# Test voice call
1. Go to Voice tab
2. Type: my-address
3. Share code: ALPHA-7234K
4. Command call

# Test video call
1. Go to Video tab
2. Type: my-address
3. Share code: ALPHA-7234K
4. Command call
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Update Google OAuth credentials (production domains)
- [ ] Configure MongoDB Atlas connection string
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure TURN server (Coturn)
- [ ] Enable MongoDB TTL indexes
- [ ] Configure CORS for production domains
- [ ] Set up monitoring (CloudWatch/Datadog)
- [ ] Configure backups (MongoDB Atlas)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design, flows, WebRTC deep dive
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Local development setup
- **[API.md](./API.md)** - Complete API reference
- **[CALLING.md](./CALLING.md)** - Voice & video calling guide

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **WebRTC** - For P2P communication standards
- **Spring Boot** - For robust backend framework
- **Next.js** - For exceptional frontend DX
- **MongoDB** - For flexible data storage with TTL support

---

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review the [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

---

**Built with privacy and user control in mind.**

*Last updated: January 2026*
