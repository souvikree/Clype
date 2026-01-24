# Voice & Video Calling - Visual Reference Guide

## 🎯 User Interface Visual Maps

### 1. Voice Call Full Screen

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│                                                                  │
│                     ●───────────────●                           │
│                   ●       ◯◯◯       ●                           │
│                 ●         ◯◯◯         ●                         │
│                │          ◯◯◯          │                        │
│                │      Alice Smith       │                        │
│                │       In call          │                        │
│                │                        │                        │
│                │       02m 34s          │                        │
│                │                        │                        │
│                │                        │                        │
│                 │       ┌─────┐         │                       │
│                  │       │ ││  │        │                       │
│                   ●      │ ││  │       ●                        │
│                     ●     └─────┘     ●                         │
│                       ●            ●                            │
│                         ●──────────●                            │
│                                                                  │
│                    ┌────────────────┐                           │
│                    │  Mute   End    │                           │
│                    │  🔇     📞     │                           │
│                    └────────────────┘                           │
│                                                                  │
│        ● Connected                                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Legend:
◯◯◯ = Avatar with gradient background
● = Pulse animation
🔇 = Mute button (toggles to 🔊 when unmuted)
📞 = End call button (red)
```

### 2. Video Call Full Screen

```
┌──────────────────────────────────────────────────────────────────┐
│ ● Connected                                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                                                            │ │
│  │                                                            │ │
│  │                  [Remote Video Stream]                    │ │
│  │                                                            │ │
│  │                                                            │ │
│  │                                                            │ │
│  │                                                            │ │
│  │                                  ┌───────────────┐        │ │
│  │                                  │ [Local Video] │        │ │
│  │                                  │   Small PIP   │        │ │
│  │                                  │   Bottom-R    │        │ │
│  │  Bob Smith                        └───────────────┘        │ │
│  │  01m 45s                                                   │ │
│  │                                                            │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│        ┌──────────────────────────────────────────────┐         │
│        │ 🔇  🎥   📞   ⛶                             │         │
│        │Mute Video End Full                          │         │
│        └──────────────────────────────────────────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Colors:
🔇 = Gray (unmuted) or Red (muted)
🎥 = Gray (on) or Red (off)
📞 = Bright red (destructive)
⛶ = Primary color (magenta)
```

### 3. Incoming Call Modal

```
                    ┌──────────────────────────┐
                    │                          │
                    │      ●────────●          │
                    │    ●   ◯◯◯   ●          │
                    │  ●     ◯◯◯     ●        │
                    │ │   (Pulsing)    │       │
                    │ │   Alice Smith  │       │
                    │ │                │       │
                    │ │ Incoming voice │       │
                    │ │ call           │       │
                    │  ●              ●       │
                    │    ●    ╋    ●         │
                    │      ●  ║  ●           │
                    │     ┌─────────┐        │
                    │     │  🎯  ✓  │        │
                    │     │Dec Acc  │        │
                    │     └─────────┘        │
                    │                        │
                    └──────────────────────────┘

Colors:
🎯 = Red (Decline button)
✓  = Green (Accept button)
```

### 4. Quick Call Panel - Collapsed

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                          ┌────┐ │
│                                          │ 📞 │ │ ← Floating button
│                                          │    │ │   (14x14 size)
│                                          └────┘ │
│                                                  │
└──────────────────────────────────────────────────┘

Position: Bottom-right corner, 24px from edges
Color: Primary (Magenta)
Size: 56x56px
```

### 5. Quick Call Panel - Expanded

```
        ┌────────────────────────────────────┐
        │ Quick Call                         │
        ├────────────────────────────────────┤
        │ ┌──────────────────────────────────┐│
        │ │ [Enter name here...]             ││
        │ └──────────────────────────────────┘│
        │ ┌──────────────┬───────────────────┐│
        │ │  📞 Voice    │  🎥 Video         ││
        │ │  Button      │  Button           ││
        │ └──────────────┴───────────────────┘│
        │                                    │
        │ Or use: voice-call <name>          │
        │                                    │
        └────────────────────────────────────┘
             ↓ Animated up from button
```

---

## 🎨 Color Palette & Button States

### Voice Call Mute Button

**Unmuted (Normal)**
```
┌──────────────┐
│   🔊 MUTE    │
│              │
│  Background: │
│  Secondary   │
│  (Blue)      │
└──────────────┘
```

**Muted (Toggled)**
```
┌──────────────┐
│   🔇 MUTED   │
│              │
│  Background: │
│  Destructive │
│  (Red)       │
└──────────────┘
```

### Video Call Controls

**Mute Audio Button**
```
Unmuted: Gray/Blue secondary color button
Muted:   Red destructive color button
Icon:    🔊 or 🔇
```

**Video Toggle Button**
```
On:  Gray/Blue secondary color button with 🎥 icon
Off: Red destructive color button with ❌ or🎥✖ icon
```

**End Call Button**
```
Always: Red destructive color
Icon:   📞 (phone handset)
Size:   Larger than other buttons
State:  Hover shows darker red
```

**Fullscreen Button**
```
Normal:     Primary color (magenta)
Fullscreen: Shows minimize icon ⛶ or ⬜
Size:       Smaller than end button
```

---

## 📏 Layout Dimensions

### Voice Call Component
```
Full Screen:  100vw × 100vh
Avatar:       128px diameter
Avatar Pulse: 140px diameter
Timer:        Large font (4xl)
Buttons:      14x14 px icons in 56px buttons
Spacing:      32px gap between sections
```

### Video Call Component
```
Full Screen:      100vw × 100vh
Remote Video:     flex-1 (fills available space)
Local Video PIP:  128x128px
PIP Position:     bottom-right, 16px from edges
Control Bar:      Full width, 72px height
Video Ref:        object-cover (maintains aspect)
```

### Quick Call Panel
```
Floating Button:  56x56px
Panel Width:      288px (min-w-72)
Input Height:     40px (py-2)
Button Heights:   40px (size="sm")
Panel Padding:    16px (p-4)
Gap Between Items: 12px
```

---

## 🎭 Animation Reference

### Avatar Pulse (Voice & Incoming Call)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: .5; }
}

animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

### Custom Ring Animation (Incoming Call)
```css
@keyframes ring {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}

animation: ring 1s infinite;
```

### Modal Fade In
```css
.modal {
  animation: fadeIn 200ms ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

### Component Scale (QuickCallPanel Expand)
```css
.panel {
  transition: all 200ms ease-in-out;
  transform: scale(1);
  opacity: 1;
}

.panel.collapsed {
  transform: scale(0.95);
  opacity: 0;
  pointer-events: none;
}
```

---

## 📱 Responsive Breakpoints

### Mobile (< 768px)
```
Voice Call:
  Avatar:        96px (reduced from 128px)
  Buttons:       Larger touch targets (48px min)
  Font:          Slightly smaller

Video Call:
  PIP Video:     96x96px (reduced)
  Controls:      Full width
  Stacked layout if needed
```

### Tablet (768px - 1024px)
```
Voice Call:
  Avatar:        112px
  Buttons:       56px with larger touch areas

Video Call:
  PIP Video:     112x112px
  Normal layout maintained
```

### Desktop (> 1024px)
```
All components:
  Default sizes maintained
  Full features available
  Optimal viewing experience
```

---

## 🔄 State Transition Diagrams

### Voice Call States

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  START (Component Mounted)                          │
│  ├─ Request Microphone Permission                   │
│  ├─ Initialize AudioContext                         │
│  ├─ Create Media Stream                             │
│  └─ Start Duration Timer                            │
│      ↓                                               │
│  CONNECTED (User can see UI)                        │
│  ├─ Display Avatar & Name                           │
│  ├─ Show Duration Timer                             │
│  ├─ Enable Mute Toggle                              │
│  ├─ Display Controls                                │
│  └─ Show Status: "Connected"                        │
│      ↓                                               │
│  (User clicks End Call)                             │
│      ↓                                               │
│  ENDING (Cleanup)                                   │
│  ├─ Stop All Tracks                                 │
│  ├─ Clear Intervals                                 │
│  ├─ Close AudioContext                              │
│  ├─ Add System Message                              │
│  └─ Unmount Component                               │
│      ↓                                               │
│  ENDED (Return to Terminal)                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Video Call States

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  START (Component Mounted)                          │
│  ├─ Request Camera + Microphone Permission          │
│  ├─ Get Video Stream (1280x720)                     │
│  ├─ Get Audio Stream                                │
│  ├─ Set Local Video Ref                             │
│  └─ Start Duration Timer                            │
│      ↓                                               │
│  CONNECTED (Video Streams Ready)                    │
│  ├─ Display Remote Video (Large)                    │
│  ├─ Display Local Video (PIP)                       │
│  ├─ Show Duration Timer                             │
│  ├─ Enable Mute Toggle                              │
│  ├─ Enable Video Toggle                             │
│  ├─ Enable Fullscreen                               │
│  └─ Show Status: "Connected"                        │
│      ↓                                               │
│  (User toggles Video Off)                           │
│      ↓ OPTIONAL                                      │
│  VIDEO_OFF (Camera Disabled)                        │
│  ├─ Stop Video Tracks                               │
│  ├─ Show Avatar Instead                             │
│  ├─ Keep Audio Active                               │
│  └─ Show Video Button as "Off"                      │
│      ↓ (User toggles Video On)                      │
│  CONNECTED (Resume Video)                           │
│      ↓                                               │
│  (User clicks End Call)                             │
│      ↓                                               │
│  ENDING (Cleanup)                                   │
│  ├─ Stop All Video Tracks                           │
│  ├─ Stop All Audio Tracks                           │
│  ├─ Clear Intervals                                 │
│  ├─ Add System Message                              │
│  └─ Unmount Component                               │
│      ↓                                               │
│  ENDED (Return to Terminal)                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Incoming Call States

```
┌──────────────────────────────────────────────┐
│                                              │
│  INCOMING (Modal Displayed)                  │
│  ├─ Show Caller Avatar (Pulsing)             │
│  ├─ Show Caller Name                         │
│  ├─ Show Call Type (Voice/Video)             │
│  ├─ Show Accept Button (Green)               │
│  └─ Show Decline Button (Red)                │
│      ↓                                        │
│  ├─(User clicks Accept)─────┬─(clicks Decline)
│  ↓                           ↓                │
│  ACCEPTED                 REJECTED           │
│  └─ Call Interface         └─ Return to     │
│     Appears               Terminal           │
│     Dialog Closes         Dialog Closes      │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🎯 Terminal Integration Visual

### Terminal Chat Workspace Flow

```
┌─────────────────────────────────────────────────────┐
│  Terminal Chat Workspace                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ Terminal Display (Chat History)             │  │
│  ├─────────────────────────────────────────────┤  │
│  │ You: my-address                             │  │
│  │ System: Server generated code: ABC123       │  │
│  │ You: connect-mate XYZ789                    │  │
│  │ System: Connected! RoomID: room-001         │  │
│  │ You: voice-call Alice ← COMMAND TYPED       │  │
│  │ System: Initiating voice call with Alice    │  │
│  │                                             │  │
│  │ ◄─── Call Manager Detects "voice-call"      │  │
│  │      ┌──────────────────────────┐           │  │
│  │      │ Full-Screen Overlay      │           │  │
│  │      │ ┌────────────────────┐   │           │  │
│  │      │ │ Voice Call Component│   │           │  │
│  │      │ │  • Avatar Display   │   │           │  │
│  │      │ │  • Duration Timer   │   │           │  │
│  │      │ │  • Mute Button      │   │           │  │
│  │      │ │  • End Button       │   │           │  │
│  │      │ └────────────────────┘   │           │  │
│  │      └──────────────────────────┘           │  │
│  │                                             │  │
│  │ (After call ends)                          │  │
│  │ You: (terminal visible again)              │  │
│  │ System: Ended voice call with Alice...      │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ Terminal Input (Command Line)               │  │
│  │ > voice-call Alice                          │  │
│  │ █ (Cursor)                                  │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎪 Side-by-Side Component Comparison

### Voice vs Video Call Component Layout

```
┌──────────────────────────────────────────────────────────┐
│  Voice Call                    │  Video Call            │
├───────────────────────────────────────────────────────────┤
│                                │                        │
│         [Avatar]               │  ┌─────────────────┐  │
│        Large Circle            │  │ Remote Video    │  │
│      Gradient Colors           │  │     (Large)     │  │
│                                │  │                 │  │
│        Alice Smith             │  │  ┌──────────┐   │  │
│         In call                │  │  │Local PIP │   │  │
│                                │  │  │(Corner)  │   │  │
│        01m 23s                 │  │  └──────────┘   │  │
│     (Timer Display)            │  │                 │  │
│                                │  │ Alice Smith     │  │
│      [Mute] [End]              │  │ 01m 45s         │  │
│   (Two buttons)                │  └─────────────────┘  │
│                                │                        │
│   ● Connected                  │ [🔇][🎥][📞][⛶]      │
│  (Status only)                 │ (Four button controls) │
│                                │                        │
├───────────────────────────────────────────────────────────┤
│ Simpler                        │ More complex UI        │
│ Audio-only focus               │ Visual-dominant focus  │
│ Fewer controls                 │ More controls          │
│ Minimal bandwidth              │ Requires good internet │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Nesting Hierarchy

```
Call Manager (Overlay)
│
├─ Voice Call Component
│  ├─ Avatar Circle (div)
│  ├─ Info Section (div)
│  │  ├─ Name (h2)
│  │  └─ Status (p)
│  ├─ Timer Display (div)
│  ├─ Controls (div)
│  │  ├─ Mute Button
│  │  └─ End Button
│  └─ Status Indicator (div)
│
├─ Video Call Component
│  ├─ Video Grid (div)
│  │  ├─ Remote Video Wrapper
│  │  │  ├─ <video> element (remote ref)
│  │  │  ├─ Fallback Avatar
│  │  │  └─ Info Overlay
│  │  └─ Local Video PIP
│  │     ├─ <video> element (local ref, muted)
│  │     └─ Fallback Avatar
│  ├─ Controls Bar (div)
│  │  ├─ Mute Button
│  │  ├─ Video Button
│  │  ├─ End Button
│  │  └─ Fullscreen Button
│  ├─ Status Indicator (div)
│  └─ Fullscreen Container (conditional)
│
├─ Incoming Call Component
│  ├─ Modal Backdrop (fixed overlay)
│  └─ Modal Content (div)
│     ├─ Avatar (div with gradient)
│     ├─ Info Section (div)
│     │  ├─ Caller Name (h2)
│     │  └─ Call Type (p)
│     ├─ Buttons (div flex)
│     │  ├─ Decline Button
│     │  └─ Accept Button
│     └─ Ring Animation (keyframes)
│
└─ Quick Call Panel (fixed)
   ├─ Panel Content (conditional)
   │  ├─ Title (h3)
   │  ├─ Input Field (<input>)
   │  ├─ Buttons (div flex)
   │  │  ├─ Voice Button
   │  │  └─ Video Button
   │  └─ Help Text (p)
   └─ Toggle Button (fixed)
```

---

## 📊 Call Duration Format Examples

### Voice Call Duration
```
0 seconds   → 0m 0s
15 seconds  → 0m 15s
60 seconds  → 1m 0s
125 seconds → 2m 5s
3600 seconds→ (not shown, stops after hours)
```

### Video Call Duration
```
0 seconds   → 0m 0s
15 seconds  → 0m 15s
60 seconds  → 1m 0s
125 seconds → 2m 5s
3600 seconds→ 1h 0m 0s
5425 seconds→ 1h 30m 25s
```

---

## 🌈 Theme Color Application

```
Component         │ Element              │ Color Token
──────────────────┼──────────────────────┼─────────────────────
Voice Call        │ Avatar background    │ primary → secondary
Voice Call        │ Avatar text          │ primary-foreground
Voice Call        │ Title/Name           │ foreground
Voice Call        │ Status text          │ muted-foreground
Voice Call        │ Mute button (off)    │ secondary
Voice Call        │ Mute button (on)     │ destructive
Voice Call        │ End button           │ destructive
Video Call        │ Local PIP border     │ accent
Video Call        │ Control buttons      │ secondary/destructive
Video Call        │ Fullscreen button    │ primary
Incoming Call     │ Avatar gradient      │ primary → secondary
Incoming Call     │ Decline button       │ destructive
Incoming Call     │ Accept button        │ green-600 (hardcoded)
Quick Panel       │ Button               │ primary
Quick Panel       │ Input background     │ input
Quick Panel       │ Input border         │ border
```

---

## ✅ This Visual Reference Covers

- All 5 calling UI components
- Color schemes and states
- Dimension and spacing specs
- Animation definitions
- State transition flows
- Terminal integration visuals
- Component hierarchies
- Theme color applications
- Responsive breakpoints
- Layout comparisons

**Use this guide to understand the visual design and implementation of the calling system!**
