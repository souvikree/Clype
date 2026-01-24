# Voice & Video Calling UI Components

This document outlines all the calling-related UI components and how they work together.

## Component Tree

```
Terminal Workspace
├── Call Manager (Overlay Manager)
│   ├── Voice Call Component
│   ├── Video Call Component
│   └── Incoming Call Component
├── Terminal Editor
│   ├── Terminal Display
│   └── Terminal Input
└── Quick Call Panel (Optional)
```

## Components Overview

### 1. Voice Call Component
**Location:** `/components/calls/voice-call.tsx`

**Purpose:** Full-screen voice call interface with audio controls.

**Features:**
- Large caller avatar display with gradient background
- Real-time call duration timer
- Microphone toggle (mute/unmute)
- End call button
- Connection status indicator
- Automatic audio stream management

**Visual Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│         [Avatar Circle with Pulse]          │
│                                             │
│              Caller Name                    │
│              Calling... / In call           │
│                                             │
│              00m 15s                        │
│                                             │
│         [Mute Button] [End Button]          │
│                                             │
│     ● Connected (Status Indicator)          │
│                                             │
└─────────────────────────────────────────────┘
```

**Key Methods:**
- `handleToggleMute()` - Toggle microphone on/off
- `handleEndCall()` - Disconnect and cleanup
- `formatDuration()` - Display MM:SS or HH:MM:SS
- `initializeAudio()` - Request and setup microphone

**Props:**
```typescript
interface VoiceCallProps {
  mateId: string;              // Unique identifier for peer
  mateName: string;            // Display name of caller
  onCallEnd: () => void;       // Callback when call ends
}
```

### 2. Video Call Component
**Location:** `/components/calls/video-call.tsx`

**Purpose:** Full-screen video call interface with camera controls and picture-in-picture layout.

**Features:**
- Remote video in main viewing area
- Local video in bottom-right corner (Picture-in-Picture)
- Audio mute toggle
- Video enable/disable toggle
- Fullscreen mode toggle
- Call duration with overlay info
- HD video support (1280x720)
- Connection status indicator

**Visual Layout:**
```
┌────────────────────────────────────────────────────┐
│  ● Connected                                       │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │                                              │ │
│  │     [Remote Video Stream - Large]           │ │
│  │                                              │ │
│  │                            ┌──────────────┐ │ │
│  │                            │[Local Video] │ │ │
│  │ Caller Name                │   Small PIP  │ │ │
│  │ 00m 45s                    └──────────────┘ │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│    [Mute]  [Video Toggle]  [End]  [Fullscreen]   │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Key Methods:**
- `handleToggleMute()` - Toggle microphone
- `handleToggleVideo()` - Toggle camera
- `handleEndCall()` - Disconnect
- `initializeVideo()` - Request camera/mic with HD constraints
- `formatDuration()` - Display time with hours support

**Props:**
```typescript
interface VideoCallProps {
  mateId: string;              // Unique identifier for peer
  mateName: string;            // Display name of caller
  onCallEnd: () => void;       // Callback when call ends
}
```

**Video Constraints:**
```typescript
video: {
  width: { ideal: 1280 },      // HD width
  height: { ideal: 720 },      // HD height
}
```

### 3. Call Manager Component
**Location:** `/components/calls/call-manager.tsx`

**Purpose:** Orchestrates call lifecycle and routes between different call types.

**Features:**
- Listens for voice-call and video-call commands
- Manages call state transitions
- Renders appropriate call component
- Overlay positioning and z-index management
- Automatic cleanup on call end

**Command Format:**
```
voice-call <name>    // Starts voice call
video-call <name>    // Starts video call
```

**How It Works:**
1. User types command in terminal
2. Call Manager detects command in message history
3. Extracts mate name from command
4. Creates call state with type and peer info
5. Renders appropriate component
6. On call end, clears state and returns to terminal

**Props:**
```typescript
// No props - operates on terminal store state
```

**State:**
```typescript
interface ActiveCall {
  type: CallType;          // 'voice' | 'video' | null
  mateId: string;          // Unique peer identifier
  mateName: string;        // Display name
}
```

### 4. Incoming Call Component
**Location:** `/components/calls/incoming-call.tsx`

**Purpose:** Modal notification for incoming calls.

**Features:**
- Caller avatar display
- Call type indication (voice/video)
- Accept/Decline buttons
- Centered modal overlay
- Blur backdrop
- Animated avatar

**Visual Layout:**
```
┌──────────────────────────────────────────┐
│                                          │
│     [Animated Avatar Circle with Name]   │
│                                          │
│          Caller Name                     │
│     Incoming voice/video call            │
│                                          │
│      [Decline]        [Accept]           │
│                                          │
└──────────────────────────────────────────┘
```

**Props:**
```typescript
interface IncomingCallProps {
  callerName: string;          // Name of incoming caller
  callType: 'voice' | 'video'; // Type of call
  onAccept: () => void;        // Callback when accepting
  onReject: () => void;        // Callback when rejecting
}
```

### 5. Quick Call Panel Component
**Location:** `/components/calls/quick-call-panel.tsx`

**Purpose:** Floating quick access panel for initiating calls.

**Features:**
- Expandable floating button
- Name input field
- Quick voice/video call buttons
- Keyboard shortcut (Enter for voice call)
- Toggle expand/collapse
- Positioned at bottom-right

**Visual Layout - Collapsed:**
```
        ┌─────┐
        │ [☎] │  <- Floating button (14x14px)
        └─────┘
```

**Visual Layout - Expanded:**
```
┌──────────────────────────────────┐
│ Quick Call                       │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ [Name Input Field]           │ │
│ └──────────────────────────────┘ │
│ ┌──────────────┬──────────────┐ │
│ │ ☎ Voice      │ 📹 Video     │ │
│ └──────────────┴──────────────┘ │
│ Or use: voice-call <name>       │
└──────────────────────────────────┘
       └──> Toggle Button
```

**Props:**
```typescript
interface QuickCallPanelProps {
  mateName?: string;                    // Default name suggestion
  onVoiceCall?: (name: string) => void; // Voice call handler
  onVideoCall?: (name: string) => void; // Video call handler
}
```

## Integration Points

### Terminal Store Integration

All call components integrate with `useTerminalStore()`:

```typescript
const { addMessage, currentSession, messages } = useTerminalStore();

// Add system messages about calls
addMessage({
  id: `call-${Date.now()}`,
  userId: currentSession?.userId || 'unknown',
  userName: 'You',
  content: 'Started voice call with Alice',
  timestamp: new Date(),
  type: 'system',
});
```

### Auth Store Integration

Voice and Video Call components use `useAuthStore()`:

```typescript
const { user, token } = useAuthStore();
// For future API calls to backend for signaling
```

## Call Flow Diagram

### Initiating a Call

```
User in Terminal
    ↓
Types: "voice-call Alice"
    ↓
Terminal Editor processes command
    ↓
Add to message history
    ↓
Call Manager detects command
    ↓
Extract mate name "Alice"
    ↓
Set active call state
    ↓
Render Voice Call Component
    ↓
Initialize audio stream
    ↓
Display call interface
```

### Receiving a Call

```
Backend sends incoming call signal (future WebSocket)
    ↓
Call Manager detects incoming call
    ↓
Display Incoming Call Component
    ↓
User clicks Accept/Decline
    ↓
If Accept → Send answer, render call component
    ↓
If Decline → Close modal, return to terminal
```

### Ending a Call

```
User clicks End Call button
    ↓
Stop all media tracks
    ↓
Clear peer connection
    ↓
Add system message to terminal
    ↓
Cleanup interval timers
    ↓
Unmount call component
    ↓
Return to terminal
```

## WebRTC Integration

### Offer/Answer Exchange

```typescript
// In SignalingWebSocketHandler.java
private void handleOffer(String fromUserId, String sdpOffer) {
  // Create peer connection if not exists
  RTCPeerConnection peerConnection = createPeerConnection(fromUserId);
  
  // Set remote description
  peerConnection.setRemoteDescription(
    new SessionDescription(SessionDescription.Type.OFFER, sdpOffer)
  );
  
  // Create and send answer
  peerConnection.createAnswer(new SdpObserver() {
    @Override
    public void onCreateSuccess(SessionDescription description) {
      peerConnection.setLocalDescription(description);
      sendAnswer(fromUserId, description.description);
    }
  });
}
```

### ICE Candidate Handling

```typescript
// Exchange ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    sendWebSocketMessage({
      type: 'ICE_CANDIDATE',
      candidate: event.candidate
    });
  }
};
```

## Styling

All components use Tailwind CSS with design tokens:

**Colors:**
- Primary (Magenta): `oklch(0.6 0.2 310)` - Call initiation
- Secondary (Blue): `oklch(0.5 0.2 280)` - Mute controls
- Accent (Cyan): `oklch(0.6 0.25 185)` - Status indicators
- Destructive (Red): `oklch(0.65 0.2 25)` - End call button
- Success (Green): `oklch(0.6 0.2 120)` - Accept button

**Animations:**
- `animate-pulse` - Avatar during ringing
- Custom `animate-ring` - Ringing effect
- Fade/scale transitions on component mount

## Error Handling

### Microphone/Camera Errors

```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: { ideal: 1280 }, height: { ideal: 720 } }
  });
} catch (error) {
  addMessage({
    type: 'error',
    content: 'Failed to access camera/microphone. Check permissions.',
  });
}
```

### Permission Denial
- Browser prompts for permissions on first use
- Component shows error message in terminal
- Call interface doesn't render without permissions

## Accessibility

- Semantic button elements with `title` attributes
- Color-coded states (green = accept, red = decline/end)
- Large touch targets on mobile (44px minimum)
- Keyboard shortcuts (Enter in quick panel for voice call)
- Screen reader descriptions on controls

## Performance Considerations

### Memory Management
- Cleanup all media tracks on unmount
- Stop interval timers to prevent memory leaks
- Close AudioContext properly
- Clear WebRTC peer connections

### Network Optimization
- Hardware-accelerated video codec (VP9, H264)
- Adaptive bitrate based on connection
- ICE candidate filtering
- STUN/TURN server configuration

### UI Responsiveness
- Smooth transitions and animations
- Non-blocking media setup
- Lazy loading of components
- Fixed positioning to prevent reflows

## Testing Checklist

- [ ] Voice call initiates with microphone
- [ ] Voice call ends cleanly
- [ ] Mute toggle works
- [ ] Duration timer increments
- [ ] Video call shows both video streams
- [ ] Picture-in-picture layout correct
- [ ] Video toggle disables camera
- [ ] Fullscreen expands correctly
- [ ] Incoming call shows proper UI
- [ ] Accept/Decline work
- [ ] Terminal commands parse correctly
- [ ] Error messages display on permission denial
- [ ] Cleanup happens on unmount

## Browser Compatibility

| Browser | Voice | Video | Status |
|---------|-------|-------|--------|
| Chrome  | ✅    | ✅    | Full support |
| Firefox | ✅    | ✅    | Full support |
| Safari  | ✅    | ✅    | Full support (iOS 14.5+) |
| Edge    | ✅    | ✅    | Full support |
| Opera   | ✅    | ✅    | Full support |

## Future Enhancements

- [ ] Add screen sharing
- [ ] Implement call recording
- [ ] Add call transfer
- [ ] Support group calls (3+ participants)
- [ ] Add virtual backgrounds
- [ ] Implement call waiting/hold
- [ ] Add audio visualizer
- [ ] Support for TURN servers
- [ ] Call history logging
- [ ] Contact list management
