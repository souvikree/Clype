# Clype - System Architecture

Complete technical architecture documentation covering system design, data flows, and protocol-level implementation details.

## 🏗 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Users                            │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             ↓                                ↓
    ┌────────────────┐              ┌─────────────────────┐
    │ Vercel (CDN)   │              │ AWS EC2             │
    │                │              │                     │
    │ Next.js SSR    │──HTTPS/WSS──→│ Nginx :443         │
    │ Static Assets  │              │   ↓                 │
    │                │              │ Spring Boot :8080   │
    └────────────────┘              │ MongoDB :27017      │
                                    │ Coturn :3478        │
                                    └─────────────────────┘

WebRTC Media Flow (P2P):
User A ←──────────→ User B
      Direct UDP/TCP
   (Server transparent)
```

## 📊 High-Level Architecture

### Three-Tier Architecture

**Presentation Layer (Frontend)**
- Next.js 16 with Server-Side Rendering
- React 19 component-based UI
- Zustand for client state management
- WebSocket client for real-time messaging
- WebRTC client for P2P media

**Application Layer (Backend)**
- Spring Boot REST API
- WebSocket handlers (STOMP protocol)
- JWT authentication filter
- Business logic services
- WebRTC signaling coordinator

**Data Layer**
- MongoDB with TTL indexes
- In-memory session management
- No media storage (P2P only)

## 🔄 Complete User Journey: From Login to Video Call

### Phase 1: Authentication

```
User visits https://clype.vercel.app
    ↓
Next.js SSR renders login page
    ↓
User clicks "Sign in with Google"
    ↓
Google OAuth redirect
    ↓
User authenticates with Google
    ↓
Google redirects to /api/auth/google/callback
    ↓
Backend exchanges code for Google tokens
    ↓
Backend fetches user info from Google API
    ↓
Backend creates/updates User in MongoDB
    ↓
Backend generates JWT token (HS512, 24h expiration)
    ↓
Frontend receives: {token, userId, email, displayName}
    ↓
Frontend stores in Zustand + localStorage
    ↓
Redirect to /dashboard
```

**JWT Token Structure:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1738224000,
  "exp": 1738310400
}
```

### Phase 2: Session Pairing

```
User A: Workspace loaded
    ↓
User A: Types "my-address"
    ↓
Frontend: POST /api/rooms/my-address/chat
    Authorization: Bearer <JWT>
    ↓
Backend: Validate JWT → Extract userId
    ↓
Backend: Generate 6-char code (e.g., ALPHA-7234K)
    ↓
Backend: Create Session document:
    {
      userId: "user-a-id",
      sessionCode: "ALPHA-7234K",
      sessionType: "CHAT",
      status: "WAITING",
      expiresAt: now + 60 minutes
    }
    ↓
Backend: Return {sessionCode, sessionId}
    ↓
Frontend: Display "Your code: ALPHA-7234K"

---

User B: Types "connect-mate ALPHA-7234K"
    ↓
Frontend: POST /api/rooms/connect/ALPHA-7234K
    Authorization: Bearer <JWT>
    ↓
Backend: Validate JWT → Extract userId
    ↓
Backend: Find Session with code "ALPHA-7234K"
    ↓
Backend: Validate session exists and not expired
    ↓
Backend: Create Room document:
    {
      roomType: "CHAT",
      status: "ACTIVE",
      participantIds: ["user-a-id", "user-b-id"],
      createdAt: now,
      expiresAt: now + 24 hours
    }
    ↓
Backend: Update both sessions: status = "ACTIVE", roomId = room-id
    ↓
Backend: Return {roomId, status}
    ↓
Both users: WebSocket connection established to /ws/chat
```

### Phase 3: Real-Time Chat

```
User A types message "Hello!"
    ↓
Frontend: WebSocket send to /app/chat/send/{roomId}
    {
      senderId: "user-a-id",
      content: "Hello!",
      timestamp: now
    }
    ↓
Backend: ChatWebSocketHandler receives
    ↓
Backend: Validate user is in room
    ↓
Backend: Save to MongoDB:
    {
      roomId: "room-id",
      senderId: "user-a-id",
      senderUsername: "Alice",
      content: "Hello!",
      createdAt: now,
      expiresAt: now + 24 hours  ← TTL index
    }
    ↓
Backend: Broadcast to /room/{roomId}/messages
    ↓
User B: WebSocket receives message
    ↓
Frontend: Display in terminal
```

**MongoDB TTL Cleanup:**
```javascript
// Runs every 60 seconds
db.messages.createIndex(
  { "expiresAt": 1 }, 
  { expireAfterSeconds: 0 }
)
// Messages auto-deleted when expiresAt < current time
```

### Phase 4: WebRTC Video Call (Protocol-Level Deep Dive)

This section explains **every millisecond** of what happens from typing `video-call Alice` to seeing her face.

#### Step 1: User Types "video-call" (0-50ms)

```typescript
// terminal-editor.tsx
handleCommand("call")
    ↓
Parse command: type="video", name="call"
    ↓
Add to terminal message history
    ↓
CallManager detects command in useEffect
```

#### Step 2: Browser Requests Media Permissions (50-2000ms)

```typescript
// webrtc-client.ts
this.localStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
});
```

**What happens inside getUserMedia:**
1. Browser checks permission state
2. If not granted, shows permission prompt
3. User clicks "Allow"
4. OS-level access to camera/microphone
5. MediaStream object created with tracks

#### Step 3: Create RTCPeerConnection (2000-2100ms)

```typescript
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:ec2-XX.compute-1.amazonaws.com:3478',
      username: 'clypeuser',
      credential: 'turn-password'
    }
  ],
  iceCandidatePoolSize: 10, // Pre-gather candidates for faster connection
  bundlePolicy: "max-bundle", // Use single connection (lower latency)
  rtcpMuxPolicy: "require", // Multiplexing for better performance
  iceTransportPolicy: "all", // Use both STUN and TURN
});

// Add local tracks
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});

// Handle remote tracks
peerConnection.ontrack = (event) => {
  remoteVideoRef.current.srcObject = event.streams[0];
};
```

#### Step 4: ICE Candidate Gathering (Parallel Process)

**Browser discovers network paths:**

```
1. Host candidates (local IPs):
   - Ethernet: 192.168.1.100:54321
   - WiFi: 192.168.1.101:54322

2. STUN query → Server Reflexive candidates (public IPs):
   ┌─────────────────────────────────────┐
   │ STUN Binding Request                │
   │ To: stun.l.google.com:19302         │
   └─────────────────────────────────────┘
              ↓
   ┌─────────────────────────────────────┐
   │ STUN Binding Response               │
   │ XOR-MAPPED-ADDRESS: 203.0.113.50    │
   └─────────────────────────────────────┘

3. TURN allocation → Relay candidates:
   ┌─────────────────────────────────────┐
   │ TURN Allocate Request               │
   │ To: ec2-XX.compute-1.amazonaws.com  │
   └─────────────────────────────────────┘
              ↓
   ┌─────────────────────────────────────┐
   │ TURN Allocate Success               │
   │ XOR-RELAYED-ADDRESS: 3.87.123.45    │
   └─────────────────────────────────────┘
```

**ICE Candidate Priority:**
```
host (direct)     : priority = 2130706431
srflx (public IP) : priority = 1694498815
relay (TURN)      : priority = 16777215
```

#### Step 5: SDP Offer Creation (2100-2200ms)

```typescript
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
```

**What's in the SDP:**
```
v=0
o=- 4611731400430051336 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=msid-semantic: WMS stream123

m=audio 9 UDP/TLS/RTP/SAVPF 111 103
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:eF3k
a=ice-pwd:8jYw2iT3xK9pL5mN6oP7qR8sS9tT0
a=fingerprint:sha-256 3B:4C:7D:...
a=setup:actpass
a=mid:0
a=sendrecv
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1

m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:eF3k
a=ice-pwd:8jYw2iT3xK9pL5mN6oP7qR8sS9tT0
a=fingerprint:sha-256 3B:4C:7D:...
a=setup:actpass
a=mid:1
a=sendrecv
a=rtcp-mux
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtcp-fb:96 goog-remb
```

**SDP Fields Explained:**
- `ice-ufrag` / `ice-pwd` - ICE authentication credentials
- `fingerprint` - Certificate fingerprint for DTLS
- `rtpmap:111 opus/48000/2` - Opus codec, 48kHz, stereo
- `rtpmap:96 VP8/90000` - VP8 video codec, 90kHz clock
- `rtcp-fb:96 nack` - Negative ACK for packet loss recovery
- `rtcp-fb:96 goog-remb` - Receiver Estimated Maximum Bitrate

#### Step 6: Signaling via WebSocket (2200-2300ms)

```typescript
// Send offer to backend
websocket.send(JSON.stringify({
  type: 'WEBRTC_OFFER',
  connectionId: 'conn-uuid',
  sdp: peerConnection.localDescription.sdp
}));
```

**Backend routes to peer:**
```java
// SignalingWebSocketHandler.java
@MessageMapping("/signaling/offer/{roomId}")
public void handleOffer(
    @DestinationVariable String roomId,
    @Payload Map<String, Object> payload,
    SimpMessageHeaderAccessor headerAccessor
) {
    // Extract sender userId from JWT
    String senderId = getUserIdFromHeaders(headerAccessor);
    
    // Get room and find other participant
    Room room = roomService.findById(roomId);
    String receiverId = room.getParticipantIds().stream()
        .filter(id -> !id.equals(senderId))
        .findFirst()
        .orElseThrow();
    
    // Forward offer to receiver
    messagingTemplate.convertAndSendToUser(
        receiverId,
        "/queue/webrtc-offer",
        payload
    );
}
```

#### Step 7: Peer Creates Answer (2300-2400ms)

```typescript
// Friend's browser
websocket.onmessage = async (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'WEBRTC_OFFER') {
    // Set remote description
    await peerConnection.setRemoteDescription({
      type: 'offer',
      sdp: msg.sdp
    });
    
    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    // Send answer back
    websocket.send(JSON.stringify({
      type: 'WEBRTC_ANSWER',
      sdp: answer.sdp
    }));
  }
};
```

#### Step 8: ICE Connectivity Checks (2400-3000ms)

**Both browsers perform connectivity checks:**

```
Try all candidate pairs (Cartesian product):
┌────────────────────────────────────────────┐
│ Your Candidates × Friend's Candidates      │
│                                            │
│ host ↔ host       : FAILED (different NATs)│
│ host ↔ srflx      : FAILED (blocked)       │
│ srflx ↔ srflx     : SUCCESS ✅             │
│ srflx ↔ relay     : backup                 │
│ relay ↔ relay     : backup                 │
└────────────────────────────────────────────┘
```

**STUN Connectivity Check (RFC 8445):**
```
Your browser sends:
┌──────────────────────────────────┐
│ STUN Binding Request             │
│ Transaction ID: random 96 bits   │
│ USERNAME: local:remote           │
│ PRIORITY: 1694498815             │
│ USE-CANDIDATE: true              │
│ MESSAGE-INTEGRITY: HMAC-SHA1     │
│ FINGERPRINT: CRC-32              │
└──────────────────────────────────┘
    From: 203.0.113.50:54321
    To: 198.51.100.75:43210

Friend's browser responds:
┌──────────────────────────────────┐
│ STUN Binding Success Response    │
│ Transaction ID: (same)           │
│ XOR-MAPPED-ADDRESS: your IP      │
│ MESSAGE-INTEGRITY: HMAC-SHA1     │
└──────────────────────────────────┘

ICE state transitions:
new → checking → connected → completed
```

#### Step 9: DTLS Handshake (3000-3200ms)

**Establish encrypted channel over UDP:**

```
1. ClientHello (Your browser)
   ↓
2. ServerHello (Friend's browser)
   ↓
3. Certificate Exchange
   ↓
4. Verify fingerprints match SDP
   ↓
5. Key Exchange (ECDHE)
   ↓
6. Derive SRTP keys
```

**SRTP Key Derivation:**
```
Master Secret (48 bytes from DTLS)
    ↓ PRF (Pseudo-Random Function)
    ↓
┌─────────────────────────────────┐
│ Client → Server Keys:           │
│   SRTP Master Key:  16 bytes    │
│   SRTP Master Salt: 14 bytes    │
│                                 │
│ Server → Client Keys:           │
│   SRTP Master Key:  16 bytes    │
│   SRTP Master Salt: 14 bytes    │
└─────────────────────────────────┘
```

#### Step 10: Media Transmission (3200ms onward)

**Video Frame Encoding & Transmission:**

```typescript
// Browser captures frame from camera
VideoFrame (1280x720 YUV420) = ~1.3MB raw
    ↓
VP8 Encoder (bitrate: 1 Mbps, fps: 30)
    ↓
Encoded frame = ~5-50 KB (varies by complexity)
    ↓
Packetize into RTP packets (MTU: 1200 bytes)
    ↓
RTP Packet Structure:
┌────────────────────────────────┐
│ Version: 2                     │
│ Payload Type: 96 (VP8)         │
│ Sequence Number: 12345         │
│ Timestamp: 2700 (30ms * 90kHz) │
│ SSRC: 1234567890               │
│ Payload: [video data]          │
└────────────────────────────────┘
    ↓
SRTP Encrypt
    ↓
Send over UDP (selected candidate pair)
```

**Audio Frame Processing:**

```
Microphone capture (48kHz, 16-bit PCM, 10ms frame)
    ↓
Acoustic Echo Cancellation (remove speaker output)
    ↓
Noise Suppression (remove background)
    ↓
Automatic Gain Control (normalize volume)
    ↓
Opus Encoder (32 kbps, forward error correction)
    ↓
Encoded frame = ~40 bytes
    ↓
RTP Packet (Payload Type: 111)
    ↓
SRTP Encrypt
    ↓
Send over UDP
```

#### Step 11: Receiving & Decoding (Peer Side)

```
Receive SRTP packet over UDP
    ↓
SRTP Decrypt
    ↓
Extract RTP payload
    ↓
Add to Jitter Buffer (reorder out-of-order packets)
    ↓
Wait for complete frame
    ↓
VP8 Decoder
    ↓
Raw video frame (1280x720)
    ↓
Render to <video> element
```

**Jitter Buffer Management:**
```
Target delay: 100ms (3 frames @ 30fps)
    ↓
If delay < 50ms → Increase buffer (prevent starvation)
If delay > 200ms → Decrease buffer (reduce latency)
    ↓
Handle packet loss:
- Request NACK (Negative ACK) for missing packets
- Request PLI (Picture Loss Indication) for corrupted frames
- Use FEC (Forward Error Correction) if enabled
```

#### Step 12: Adaptive Bitrate Control (Ongoing)

**Google Congestion Control (GCC):**

```
Monitor network conditions every 1 second:
    ↓
Calculate packet loss rate:
    loss_rate = packets_lost / packets_sent
    ↓
Calculate delay gradient:
    delay_delta = arrival_time - send_time
    ↓
Adjust bitrate:
    IF loss_rate > 5% OR delay increasing:
        bitrate *= 0.85  (reduce 15%)
    ELSE IF loss_rate < 2% AND delay stable:
        bitrate *= 1.05  (increase 5%)
    ↓
Clamp: min_bitrate (150 kbps) ≤ bitrate ≤ max_bitrate (2500 kbps)
    ↓
Update encoder:
    videoEncoder.setTargetBitrate(bitrate)
```

**RTCP Feedback Loop:**
```
Every 1 second:
    ↓
Sender sends RTCP Sender Report:
    - Packets sent
    - Bytes sent
    - Timestamp
    ↓
Receiver sends RTCP Receiver Report:
    - Packets received
    - Packets lost
    - Jitter
    - Last sender report timestamp
    ↓
Sender adjusts based on feedback
```

## 🗄 Data Architecture

### MongoDB Schema

**Users Collection:**
```javascript
{
  _id: ObjectId,
  googleId: String (unique, indexed),
  email: String (unique, indexed),
  displayName: String,
  profilePicture: String,
  createdAt: ISODate,
  lastLogin: ISODate
}
```

**Sessions Collection (TTL: 60 minutes):**
```javascript
{
  _id: ObjectId,
  userId: String (indexed),
  sessionCode: String (unique, indexed),
  sessionType: "CHAT" | "VOICE" | "VIDEO",
  roomId: String (nullable),
  status: "WAITING" | "ACTIVE" | "COMPLETED",
  createdAt: ISODate,
  expiresAt: ISODate  // TTL index
}

db.sessions.createIndex(
  { "expiresAt": 1 }, 
  { expireAfterSeconds: 0 }
)
```

**Rooms Collection:**
```javascript
{
  _id: ObjectId,
  roomType: "CHAT" | "VOICE" | "VIDEO",
  status: "ACTIVE" | "CLOSED",
  participantIds: [String, String],  // Max 2 users
  createdAt: ISODate,
  expiresAt: ISODate
}

db.rooms.createIndex({ "participantIds": 1 })
```

**Messages Collection (TTL: 24 hours):**
```javascript
{
  _id: ObjectId,
  roomId: String (indexed),
  senderId: String,
  senderUsername: String,
  content: String,
  type: "TEXT" | "SYSTEM",
  createdAt: ISODate,
  expiresAt: ISODate  // TTL index
}

db.messages.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.messages.createIndex({ "roomId": 1, "createdAt": -1 })
```

### State Management (Frontend)

**Auth Store (Zustand):**
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (userData) => Promise<void>;
  logout: () => void;
  setUser: (user) => void;
  setToken: (token) => void;
}
```

**Terminal Store (Zustand):**
```typescript
interface TerminalStore {
  tabs: TerminalTab[];
  activeTabId: string | null;
  currentSession: Session | null;
  messages: Message[];
  addTab: (type) => void;
  removeTab: (id) => void;
  setActiveTab: (id) => void;
  addMessage: (message) => void;
  clearMessages: () => void;
}
```

## 🔐 Security Architecture

### Authentication Flow

```
1. User → Google OAuth
2. Google → Authorization code
3. Backend → Exchange code for tokens
4. Backend → Fetch user info from Google
5. Backend → Create/update User in MongoDB
6. Backend → Generate JWT (HS512 with secret key)
7. Frontend → Store JWT in Zustand + localStorage
8. Frontend → Include in all API requests: Authorization: Bearer <token>
```

### Authorization Flow

```
Every HTTP request:
    ↓
JwtAuthenticationFilter intercepts
    ↓
Extract token from Authorization header
    ↓
JwtTokenProvider validates token:
    - Signature valid?
    - Not expired?
    - Claims present?
    ↓
If valid:
    Extract userId from claims
    Set SecurityContextHolder with userId
    Allow request to proceed
If invalid:
    Return 401 Unauthorized
```

### WebSocket Authentication

```
WebSocket connection initiated:
    ↓
Client sends CONNECT frame with header:
    Authorization: Bearer <JWT>
    ↓
Backend validates JWT
    ↓
If valid:
    Store session with userId mapping
    Allow subscription to /user/{userId} channels
If invalid:
    Disconnect with error
```

### Room Authorization

```
User sends message to room:
    ↓
Backend validates JWT → get userId
    ↓
Backend queries Room: participantIds contains userId?
    ↓
If yes:
    Process message
If no:
    Return 403 Forbidden
```

## 🌊 WebSocket Protocol (STOMP)

### Connection Lifecycle

```
1. Client → HTTP Upgrade request
2. Server → 101 Switching Protocols
3. Client → CONNECT frame
4. Server → CONNECTED frame
5. Client → SUBSCRIBE /room/{roomId}/messages
6. Server → RECEIPT
   (Connection established)
```

### Message Flow

```
Sender → SEND to /app/chat/send/{roomId}
    ↓
Backend ChatWebSocketHandler
    ↓
Save to MongoDB
    ↓
Broadcast MESSAGE to /room/{roomId}/messages
    ↓
All subscribers receive message
```

### Typing Indicators

```
User starts typing → SEND to /app/chat/typing/{roomId}
    ↓
Backend broadcasts to /room/{roomId}/typing
    ↓
Other user sees "{username} is typing..."
    ↓
Debounce after 2 seconds of no typing
```

## 🚀 Performance Optimization

### Database Optimization

**Compound Indexes:**
```javascript
// Messages: Query by room + sort by time
db.messages.createIndex({ roomId: 1, createdAt: -1 })

// Sessions: Find active session by code
db.sessions.createIndex({ sessionCode: 1, status: 1 })

// Rooms: Find rooms by participant
db.rooms.createIndex({ participantIds: 1, status: 1 })
```

**Connection Pooling:**
```yaml
# application.yml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/clype
      options:
        maxPoolSize: 50
        minPoolSize: 10
        maxIdleTimeMS: 60000
```

### Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load calling components
const VoiceCall = lazy(() => import('@/components/calls/voice-call'));
const VideoCall = lazy(() => import('@/components/calls/video-call'));
```

**WebSocket Reconnection:**
```typescript
const reconnectWithBackoff = () => {
  let delay = 1000;
  const maxDelay = 30000;
  
  const reconnect = () => {
    setTimeout(() => {
      createWebSocketConnection();
      delay = Math.min(delay * 2, maxDelay);
    }, delay);
  };
  
  websocket.onclose = reconnect;
};
```

### WebRTC Optimization

**ICE Candidate Optimization:**
```typescript
const config = {
  iceCandidatePoolSize: 10,  // Pre-gather candidates
  bundlePolicy: 'max-bundle',  // Multiplex all tracks
  rtcpMuxPolicy: 'require'  // Multiplex RTP and RTCP
};
```

## 📊 Monitoring & Observability

### Key Metrics

**Backend:**
- Request latency (p50, p95, p99)
- WebSocket connection count
- Active room count
- Message throughput (msg/sec)
- Database query time
- JWT validation time

**Frontend:**
- Page load time
- WebSocket connection state
- Message delivery latency
- WebRTC connection state
- Packet loss rate
- Video quality (bitrate, fps, resolution)

### Logging Strategy

**Backend:**
```java
@Slf4j
public class ChatWebSocketHandler {
    public void handleMessage(Message message) {
        log.info("Message received: roomId={}, senderId={}, size={}", 
            message.getRoomId(), 
            message.getSenderId(), 
            message.getContent().length());
    }
}
```

**Frontend:**
```typescript
const sendMessage = (content: string) => {
  console.log('[Clype] Sending message', {
    roomId,
    contentLength: content.length,
    timestamp: Date.now()
  });
  websocket.send(JSON.stringify({...}));
};
```

## 🔄 Scalability Considerations

### Horizontal Scaling (Future)

**Stateless Backend:**
- JWT authentication (no server sessions)
- Redis for shared WebSocket session storage
- Database handles state persistence

**Load Balancer Configuration:**
```nginx
upstream backend {
    least_conn;  # Least connections algorithm
    server backend-1:8080;
    server backend-2:8080;
    server backend-3:8080;
}

# Sticky sessions for WebSocket
upstream websocket {
    ip_hash;
    server backend-1:8080;
    server backend-2:8080;
}
```

**Database Scaling:**
- MongoDB replica set for high availability
- Sharding for collections > 1GB
- Read replicas for query distribution

This architecture supports the current implementation while providing clear paths for future scaling as user base grows.
