# Clype - Voice & Video Calling Guide

Complete guide for using and understanding the voice and video calling features in Clype.

## 🎯 Overview

Clype includes production-grade WebRTC-powered voice and video calling with:
- **P2P Encryption** - End-to-end encrypted media (DTLS-SRTP)
- **HD Video** - Up to 1280x720 @ 30fps
- **High-Quality Audio** - 48kHz Opus codec with echo cancellation
- **NAT Traversal** - STUN/TURN support for restrictive networks
- **Server Transparent** - Media flows directly between peers

---

## 🚀 Quick Start

### Making a Voice Call

```bash
# After pairing with connect-mate
call

# Browser requests microphone permission
# Full-screen voice interface appears
# Click "End Call" when done
```

### Making a Video Call

```bash
# After pairing with connect-mate
call

# Browser requests camera and microphone permissions
# Full-screen video interface appears
# Your video in bottom-right corner
# Peer's video in main area
# Click "End Call" when done
```

---

## 🎨 User Interface

### Voice Call Screen

```
┌──────────────────────────────────┐
│                                  │
│      [Avatar with Gradient]      │
│                                  │
│           Mate                   │
│          In call                 │
│                                  │
│         01m 23s                  │
│                                  │
│    [Mute]         [End Call]     │
│                                  │
│      ● Connected                 │
│                                  │
└──────────────────────────────────┘
```

**Controls:**
- **Mute Button** - Toggle microphone on/off (gray = on, red = muted)
- **End Call Button** - Disconnect call
- **Duration Timer** - Shows elapsed time (MM:SS or HH:MM:SS)
- **Status Indicator** - Connection state (● Connected)

### Video Call Screen

```
┌──────────────────────────────────────┐
│ ● Connected             [Fullscreen] │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │   [Remote Video - Full Screen]   │ │
│ │                                  │ │
│ │              [Local Video PIP]   │ │
│ │              (Bottom-right)      │ │
│ │                                  │ │
│ │   Mate       01m 45s             │ │
│ └──────────────────────────────────┘ │
│                                      │
│  [Mute] [Video] [End]                │
└──────────────────────────────────────┘
```

**Controls:**
- **Mute Audio** - Toggle microphone (gray = on, red = muted)
- **Toggle Video** - Turn camera on/off (gray = on, red = off)
- **End Call** - Disconnect call
- **Fullscreen** - Expand to full screen
- **Duration Timer** - Shows elapsed time

---

## 🔧 How It Works

### Complete Call Flow

```
1. User types: call
      ↓
2. Terminal detects command
      ↓
3. Call Manager launches Voice Call component
      ↓
4. Browser requests microphone permission
      ↓
5. User grants permission
      ↓
6. getUserMedia() obtains audio stream
      ↓
7. RTCPeerConnection created
      ↓
8. ICE candidates gathered (STUN/TURN)
      ↓
9. SDP offer created and sent via WebSocket
      ↓
10. Backend routes offer to peer
      ↓
11. Peer creates SDP answer
      ↓
12. Both exchange ICE candidates
      ↓
13. ICE connectivity checks (try all paths)
      ↓
14. DTLS handshake (establish encryption)
      ↓
15. P2P connection established
      ↓
16. Media flows directly between peers
      ↓
17. User clicks "End Call"
      ↓
18. Cleanup: stop tracks, close connection
      ↓
19. Return to terminal
```

### WebRTC Architecture

**Signaling (via WebSocket):**
- SDP offer/answer exchange
- ICE candidate sharing
- Connection state management

**Media (P2P UDP/TCP):**
- Direct peer-to-peer connection
- DTLS-SRTP encryption
- No server involvement

**Network Paths (Priority Order):**
1. **Host** - Direct connection (same network)
2. **Server Reflexive** - Public IP to public IP (STUN)
3. **Relay** - Via TURN server (fallback)

---

## 🎛️ Configuration

### Video Quality Settings

Default: **1280x720 @ 30fps**

To modify, edit constraints in calling components:

```typescript
// Lower quality for slower connections
video: {
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 15 }
}

// Higher quality for fast connections
video: {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 60 }
}
```

### Audio Quality Settings

Default: **48kHz, Opus codec, Echo Cancellation ON**

```typescript
audio: {
  echoCancellation: true,    // Remove echo
  noiseSuppression: true,    // Remove background noise
  autoGainControl: true,     // Normalize volume
  sampleRate: 48000          // High quality
}
```

### STUN/TURN Server Configuration

```typescript
// In webrtc-client.ts
const config = {
  iceServers: [
    // Google's public STUN server
    { urls: 'stun:stun.l.google.com:19302' },
    
    // Your TURN server (for NAT traversal)
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
};
```

---

## 🐛 Troubleshooting

### "Failed to access microphone"

**Causes:**
- Browser permission denied
- Microphone in use by another app
- No microphone detected

**Solutions:**
1. Grant permission in browser settings
2. Close other apps using microphone
3. Check system sound settings
4. Try a different browser
5. Restart browser

---

### "Failed to access camera"

**Causes:**
- Browser permission denied
- Camera in use by another app
- No camera detected
- Camera hardware disabled

**Solutions:**
1. Grant permission in browser settings
2. Close other apps using camera (Zoom, Skype, etc.)
3. Check camera is connected
4. Enable camera in system settings
5. Try a different browser

---

### No Audio During Call

**Causes:**
- Microphone muted
- System volume muted
- Wrong audio device selected
- Network issues

**Solutions:**
1. Check mute button in call UI (should be gray)
2. Verify system volume is up
3. Check audio output device in system settings
4. Ask peer to check their microphone
5. Restart call

---

### No Video During Call

**Causes:**
- Camera disabled in call
- Camera permissions denied
- Camera disconnected
- Bandwidth too low

**Solutions:**
1. Click video toggle button (should be gray = on)
2. Grant camera permissions
3. Check camera connection
4. Check internet speed (need >1 Mbps for video)

---

### Poor Video Quality

**Causes:**
- Low bandwidth
- High packet loss
- CPU overload
- Network congestion

**Solutions:**
1. Check internet speed (run speed test)
2. Close bandwidth-heavy applications
3. Move closer to WiFi router
4. Reduce video quality settings
5. Switch to voice-only call

---

### Connection Issues / Call Drops

**Causes:**
- NAT/firewall blocking
- Unstable internet
- No TURN server configured
- ICE candidates failed

**Solutions:**
1. Configure TURN server (see DEPLOYMENT.md)
2. Check firewall settings (allow UDP 49152-65535)
3. Use wired connection instead of WiFi
4. Restart router
5. Contact network administrator

---

## 🔐 Privacy & Security

### End-to-End Encryption

All media is encrypted using:
- **DTLS** - Datagram Transport Layer Security (key exchange)
- **SRTP** - Secure Real-time Transport Protocol (media encryption)
- **AES-128-GCM** - Encryption cipher

**The server never sees:**
- Video frames
- Audio samples
- Media metadata

### Data Retention

- **Calls:** No recording or storage
- **Metadata:** Connection logs only (no content)
- **Signaling:** Messages deleted after delivery

### Permissions

Required browser permissions:
- **Microphone** - For voice and video calls
- **Camera** - For video calls only

Permissions requested only when needed, can be revoked anytime.

---

## 📊 Technical Details

### Audio Processing Pipeline

```
Microphone Capture (48kHz, 16-bit PCM)
    ↓
Acoustic Echo Cancellation (remove speaker output)
    ↓
Noise Suppression (remove background)
    ↓
Automatic Gain Control (normalize volume)
    ↓
Opus Encoder (32 kbps, 10ms frames)
    ↓
RTP Packetization
    ↓
SRTP Encryption
    ↓
UDP Transmission
    ↓
Peer Receives → Jitter Buffer → Decoder → Speaker
```

### Video Processing Pipeline

```
Camera Capture (1280x720 YUV420)
    ↓
VP8/H.264 Encoder (target 1 Mbps)
    ↓
RTP Packetization (MTU 1200 bytes)
    ↓
SRTP Encryption
    ↓
UDP Transmission
    ↓
Peer Receives → Jitter Buffer → Decoder → Display
```

### Adaptive Bitrate Control

WebRTC automatically adjusts quality based on:
- **Packet Loss** - Reduce bitrate if >5% loss
- **Network Delay** - Reduce if delay increasing
- **Bandwidth** - Increase if network has capacity

Range: 150 kbps (minimum) to 2500 kbps (maximum)

### NAT Traversal

**ICE Process:**
1. Gather local candidates (host IPs)
2. Query STUN server (get public IP)
3. Allocate TURN relay (if needed)
4. Try all candidate pairs
5. Select best working path

**Typical Success Rates:**
- Direct (host): ~20% (same network)
- STUN (srflx): ~65% (most home networks)
- TURN (relay): ~15% (corporate firewalls)

---

## 📱 Browser Compatibility

| Browser | Voice | Video | Notes |
|---------|-------|-------|-------|
| Chrome 100+ | ✅ | ✅ | Best performance |
| Firefox 100+ | ✅ | ✅ | Full support |
| Safari 15+ | ✅ | ✅ | iOS 14.5+ required |
| Edge 100+ | ✅ | ✅ | Chromium-based |
| Opera | ✅ | ✅ | Full support |

**Mobile Support:**
- iOS Safari: ✅ (requires iOS 14.5+)
- Android Chrome: ✅
- Android Firefox: ✅

---

## 🎯 Best Practices

### For Best Call Quality

1. **Use wired internet** instead of WiFi when possible
2. **Close bandwidth-heavy apps** (streaming, downloads)
3. **Good lighting** for video calls (face the light source)
4. **Use headphones** to prevent echo
5. **Stable connection** - Don't move around during calls
6. **Test first** - Do a quick test call before important calls

### For Privacy

1. **Grant permissions** only when needed
2. **Revoke permissions** after calls
3. **Use secure networks** - Avoid public WiFi for calls
4. **Close calls properly** - Click "End Call" button
5. **Check mute status** - Ensure you're muted when needed

---

## 🔮 Future Enhancements

Planned features:
- **Screen Sharing** - Share your screen during calls
- **Group Calls** - Support for 3+ participants
- **Call Recording** - Optional recording with consent
- **Virtual Backgrounds** - AI-powered background blur
- **Chat During Calls** - Text while on call
- **Call Transfer** - Transfer to another user
- **Call History** - View past call logs

---

## 📚 Additional Resources

- **WebRTC Basics:** [webrtc.org](https://webrtc.org)
- **STUN/TURN Servers:** [webrtc.org/getting-started](https://webrtc.org/getting-started)
- **Browser API:** [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

For deployment configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

**Questions?** Check the [main README](./README.md) or open an issue on GitHub.
