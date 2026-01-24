# Voice & Video Calling Guide

## Overview

Terminal Chat includes real-time voice and video calling capabilities using WebRTC for peer-to-peer communication. Calls are encrypted end-to-end and routed through your WebSocket connection for signaling.

## Features

### Voice Calling
- Crystal-clear audio using WebRTC
- Microphone toggle (mute/unmute)
- Call duration timer
- Automatic cleanup on disconnect
- Background audio visualization

### Video Calling
- HD video streaming (up to 1280x720)
- Picture-in-picture layout (your video in corner, peer's in main)
- Independent audio and video controls
- Fullscreen mode
- Video enable/disable toggle
- Automatic lighting adaptation

## How to Use

### Starting a Voice Call

1. **Open Terminal Chat** and connect with a mate using `connect-mate <code>`
2. **Initiate call** with command:
   ```
   voice-call <mate_name>
   ```
3. **Terminal will show**: "Initiating voice call with [name]..."
4. **Call Interface appears** with:
   - Large avatar display
   - Call duration counter
   - Mute button (toggles microphone)
   - Disconnect button
   - Connection status indicator

### Starting a Video Call

1. **Open Terminal Chat** and connect with a mate
2. **Initiate call** with command:
   ```
   video-call <mate_name>
   ```
3. **Call Interface appears** with:
   - Full-screen video layout
   - Your video in bottom-right corner (Picture-in-Picture)
   - Peer's video in main viewing area
   - Control bar at bottom

### During Calls

#### Voice Call Controls
- **Mute Button** - Click to toggle microphone on/off
  - Red button = Muted
  - Gray button = Unmuted
- **Duration Timer** - Shows elapsed time in MM:SS or HH:MM:SS format
- **End Call Button** - Red phone icon to disconnect
- **Status Indicator** - Green dot shows "Connected" status

#### Video Call Controls
- **Mute Audio** - Toggle microphone (gray/red button)
- **Toggle Video** - Turn camera on/off (gray/red button)
- **Fullscreen** - Expand to full screen for better view
- **End Call** - Disconnect and return to terminal
- **Duration** - Displayed in remote caller info overlay

### Receiving Calls

When someone calls you:

1. **Incoming Call Screen appears** showing:
   - Caller's name/initial
   - Call type (Voice or Video)
   - Accept/Decline buttons

2. **Accept** to start the call
3. **Decline** to reject and return to terminal

## Technical Implementation

### Client-Side Components

#### Voice Call Component (`/components/calls/voice-call.tsx`)
- Manages WebRTC audio connection
- Handles microphone permissions and stream management
- Displays call UI with controls
- Tracks call duration

#### Video Call Component (`/components/calls/video-call.tsx`)
- Manages WebRTC video and audio streams
- Handles camera permissions and constraints
- Picture-in-picture layout system
- Fullscreen capability
- Real-time video display with refs

#### Call Manager (`/components/calls/call-manager.tsx`)
- Listens for call commands in terminal
- Routes to appropriate call component
- Manages call lifecycle and dismissal
- Overlay management

#### Incoming Call Component (`/components/calls/incoming-call.tsx`)
- Displays incoming call notification
- Accept/reject functionality
- Visual feedback during ringing

### Backend Signaling

The Spring Boot backend provides WebSocket handlers for call signaling:

**SignalingWebSocketHandler** (`/backend/src/main/java/com/terminalchat/websocket/SignalingWebSocketHandler.java`)
- Manages WebRTC offer/answer exchange
- Routes ICE candidates between peers
- Handles call initiation and termination
- Maintains peer connection state

**WebSocket Events**:
```
OFFER          - Send SDP offer to peer
ANSWER         - Send SDP answer back
ICE_CANDIDATE  - Share ICE candidate for NAT traversal
CALL_END       - Notify peer of call termination
```

### WebRTC Flow

1. **Call Initiator** sends OFFER via WebSocket
2. **Call Recipient** creates ANSWER and sends back
3. **Both peers** exchange ICE candidates for connectivity
4. **Direct P2P connection** established
5. **Media streams** flow directly between peers (not through server)
6. **Server never sees video/audio** - completely encrypted

## Permissions Required

### Microphone
- Required for both voice and video calls
- Browser will prompt on first use
- Grant permission to proceed

### Camera
- Required for video calls only
- Browser will prompt on first use
- Can be turned off during call with video toggle button

## Troubleshooting

### "Failed to access microphone"
- Check browser permissions in settings
- Ensure no other app is using the microphone
- Try a different browser
- Restart your browser

### "Failed to access camera/microphone"
- Same as above
- Also check that your camera isn't disconnected
- Try restarting your device

### No Audio
- Verify microphone is working (test in system settings)
- Check that audio output device is selected
- Try toggling mute off and back on

### No Video
- Ensure camera is connected and working
- Grant camera permissions
- Try toggling video off and back on
- Check camera isn't in use by another app

### Connection Issues
- Ensure both peers have WebSocket connection established
- Check NAT/firewall settings
- Try refreshing page and reconnecting
- Both users should use same session/room code

### Lag or Delay
- Check internet connection speed
- Reduce video resolution (lower bandwidth)
- Close other applications using bandwidth
- Consider reducing video quality settings

## Advanced Configuration

### Video Quality Settings

In `/lib/webrtc-client.ts`, modify the `VideoConstraints`:

```typescript
video: {
  width: { ideal: 1280 },      // Change to 640 for lower bandwidth
  height: { ideal: 720 },      // Change to 480 for lower bandwidth
  frameRate: { ideal: 30 }     // Can reduce to 15 for slow connections
}
```

### Audio Configuration

In `voice-call.tsx` or `video-call.tsx`:

```typescript
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}
```

### ICE Servers (STUN/TURN)

Configure in `/lib/webrtc-client.ts` for better NAT traversal:

```typescript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};
```

## API Reference

### Call Commands

#### voice-call
```
voice-call <name>
```
Initiates a voice call with the specified person.

**Parameters:**
- `<name>` - Display name of the person to call

**Example:**
```
voice-call Alice
voice-call Bob
```

#### video-call
```
video-call <name>
```
Initiates a video call with the specified person.

**Parameters:**
- `<name>` - Display name of the person to call

**Example:**
```
video-call Alice
video-call Bob
```

## Best Practices

1. **Test audio/video** before important calls
2. **Check lighting** for video calls
3. **Use headphones** to avoid echo
4. **Close unnecessary apps** for better performance
5. **Ensure stable internet** connection before starting call
6. **Grant permissions** when browser asks
7. **Position camera** at eye level for better appearance
8. **Minimize background** noise for voice clarity

## Privacy & Security

- **End-to-End Encrypted** - Server cannot see or hear your calls
- **P2P Connection** - Media goes directly between users
- **No Call Logs** - Calls are not recorded or stored
- **Peer Discovery** - Uses only shared session codes
- **Media Control** - You control when audio/video is sent

## Limitations

- **Same Network Recommended** - Works best with both users on same public network or with TURN server configuration
- **No Call Transfer** - Cannot transfer calls to other users
- **One Call at a Time** - Cannot have multiple concurrent calls
- **Mobile Support** - Works on mobile but may require permissions grants
- **Browser Support** - Requires WebRTC support (Chrome, Firefox, Safari, Edge)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Terminal Chat Client                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Terminal Workspace                                          │
│  ├── Terminal Editor (Commands: voice-call, video-call)     │
│  ├── Terminal Display (Shows call initiation)               │
│  └── Call Manager (Listens for call commands)               │
│                                                               │
│  Call Components                                             │
│  ├── Voice Call UI (Mic, Duration, End)                     │
│  ├── Video Call UI (Video streams, Controls)                │
│  └── Incoming Call UI (Accept/Reject)                       │
│                                                               │
│  WebRTC Client                                               │
│  ├── Peer Connection Management                             │
│  ├── Media Stream Handling                                  │
│  └── ICE Candidate Exchange                                 │
│                                                               │
│  WebSocket Connection                                        │
│  └── Signaling Communication                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ║ WebSocket (Signaling)
                            ║ P2P Connection (Media)
                            ║
┌─────────────────────────────────────────────────────────────┐
│                  Spring Boot Backend                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SignalingWebSocketHandler                                   │
│  ├── Offer/Answer Exchange                                  │
│  ├── ICE Candidate Routing                                  │
│  └── Peer State Management                                  │
│                                                               │
│  Room & Session Management                                  │
│  ├── Peer Discovery                                         │
│  └── Connection Lifecycle                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Future Enhancements

- [ ] Call recording
- [ ] Screen sharing
- [ ] Group calls (3+ participants)
- [ ] Call transfer
- [ ] Automatic call logging
- [ ] Advanced audio filters
- [ ] Virtual backgrounds
- [ ] Call waiting/hold
- [ ] TURN server integration
- [ ] Mobile app optimization
