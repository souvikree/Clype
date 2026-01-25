"use client";

import { useEffect, useRef, useState } from "react";
import { TerminalTab } from "@/lib/terminal-store";
import { useTerminalStore } from "@/lib/terminal-store";
import { useAuthStore } from "@/lib/auth-store";
import { Terminal } from "./terminal-display";
import { TerminalInput } from "./terminal-input";
import { WebSocketClient } from "@/lib/websocket-client";
import { WebRTCClient } from "@/lib/webrtc-client";

export function TerminalEditor({ tab }: { tab: TerminalTab }) {
  const { addLine, setCommandInput, updateTab, startCall, receiveCall } = useTerminalStore();
  const { user, token } = useAuthStore();
  const terminalRef = useRef<HTMLDivElement>(null);

  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const rtcMap = useRef<Map<string, WebRTCClient>>(new Map());
  const signalingRef = useRef<WebSocketClient | null>(null);

  // Auto scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [tab.history]);

  // ================= CHAT SOCKET =================
  useEffect(() => {
    if (!tab.roomId || wsClient) return;

    const client = new WebSocketClient(
      `${process.env.NEXT_PUBLIC_WS_URL}/chat`,
      token!,
    );

    client.connect(
      () => {
        client.subscribe(`/room/${tab.roomId}/messages`, (msg) => {
          const data = JSON.parse(msg.body);
          addLine(tab.id, {
            id: `msg-${Date.now()}`,
            content: data.content,
            type: "message",
            author: data.senderUsername,
            timestamp: new Date(data.createdAt),
          });
        });

        addLine(tab.id, {
          id: `sys-${Date.now()}`,
          content: `WebSocket connected. Room: ${tab.roomId}`,
          type: "system",
          timestamp: new Date(),
        });
      },
      (err) => {
        addLine(tab.id, {
          id: `err-${Date.now()}`,
          content: `WebSocket error: ${err}`,
          type: "error",
          timestamp: new Date(),
        });
      },
    );

    setWsClient(client);
    // return () => client.disconnect();
  }, [tab.roomId, token, user]);

  // ================= SIGNALING SOCKET =================
useEffect(() => {
  const roomId = tab.roomId;
  if (!roomId || (tab.type !== "voice" && tab.type !== "video")) return;
  if (signalingRef.current) return;

    console.log("🔌 Connecting to signaling socket for room:", roomId);

    addLine(tab.id, {
      id: `sys-${Date.now()}`,
      content: `🔌 Connecting to signaling server...`,
      type: "system",
      timestamp: new Date(),
    });

    const signaling = new WebSocketClient(
      `${process.env.NEXT_PUBLIC_WS_URL}/signaling`,
      token!,
    );

    signaling.connect(() => {
      console.log("✅ Signaling socket connected");

      addLine(tab.id, {
        id: `sys-${Date.now()}`,
        content: `✅ Signaling ready. Type 'call' to start ${tab.type} call.`,
        type: "system",
        timestamp: new Date(),
      });

      // Incoming Offer
      signaling.subscribe(`/room/${roomId}/webrtc-offer`, async (m) => {
        const { sdpOffer, callType } = JSON.parse(m.body);

        if (rtcMap.current.has(tab.id)) return; 

        const rtc = new WebRTCClient();
        rtcMap.current.set(tab.id, rtc);

        await rtc.init((c) => {
          signaling.send(`/app/signaling/ice-candidate/${roomId}`, {
            senderId: user!.id,
            candidate: c,
          });
        });

        await rtc.openMedia(true, callType === "video");
        await rtc.setRemote(sdpOffer);

        const answer = await rtc.createAnswer();
        signaling.send(`/app/signaling/answer/${roomId}`, {
          senderId: user!.id,
          sdpAnswer: answer,
        });

        receiveCall(callType, roomId, tab.mateUsername || "Mate", rtc, tab.id);
      });

      // Incoming Answer
      signaling.subscribe(`/room/${roomId}/webrtc-answer`, async (m) => {
        const { sdpAnswer } = JSON.parse(m.body);

        const pc = rtcMap.current.get(tab.id);
        if (!pc) return;
        if (pc.getSignalingState() !== "have-local-offer") return; 

        await pc.setRemote(sdpAnswer);

        addLine(tab.id, {
          id: `sys-${Date.now()}`,
          content: `✅ Call connected!`,
          type: "system",
          timestamp: new Date(),
        });
      });

      // ICE Candidates
      signaling.subscribe(`/room/${roomId}/ice-candidate`, async (m) => {
        const { candidate } = JSON.parse(m.body);
        const pc = rtcMap.current.get(tab.id);
        if (pc && candidate) {
          await pc.addIce(candidate);
        }
      });
    }, (err) => {
      console.error("❌ Signaling error:", err);
      addLine(tab.id, {
        id: `err-${Date.now()}`,
        content: `❌ Signaling failed. Check connection.`,
        type: "error",
        timestamp: new Date(),
      });
    });

    signalingRef.current = signaling;

    // return () => {
    //   signaling.disconnect();
    //   signalingRef.current = null;
    // };
  }, [tab.roomId, tab.type, token, user]);

  // ================= COMMAND HANDLER =================
  const handleCommand = async (input: string) => {
    if (!input.trim()) return;

    const command = input.trim();
    const lower = command.toLowerCase();

    const isSystemCommand =
      lower === "my-address" ||
      lower.startsWith("connect-mate ") ||
      lower === "help" ||
      lower === "call";

    if (isSystemCommand) {
      addLine(tab.id, {
        id: `cmd-${Date.now()}`,
        content: `${tab.username} : ${tab.type} > ${input}`,
        type: "prompt",
        timestamp: new Date(),
      });
    }

    if (lower === "my-address") {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rooms/my-address/${tab.type}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        addLine(tab.id, {
          id: `err-${Date.now()}`,
          content: `my-address failed: ${await res.text() || res.status}`,
          type: "error",
          timestamp: new Date(),
        });
        return;
      }

      const data = await res.json();
      addLine(tab.id, {
        id: `sys-${Date.now()}`,
        content: `Your code: ${data.sessionCode}`,
        type: "system",
        timestamp: new Date(),
      });

      updateTab(tab.id, {
        sessionCode: data.sessionCode,
        sessionId: data.sessionId,
      });
      return;
    }

    if (lower.startsWith("connect-mate ")) {
      const mateCode = command.substring(13).trim().toUpperCase();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rooms/connect/${mateCode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionType: tab.type,
            mySessionId: tab.sessionId,
          }),
        }
      );

      if (!res.ok) {
        addLine(tab.id, {
          id: `err-${Date.now()}`,
          content: `Connection failed: ${await res.text() || "Invalid code"}`,
          type: "error",
          timestamp: new Date(),
        });
        return;
      }

      const data = await res.json();
      updateTab(tab.id, { roomId: data.roomId, mateUsername: "Mate" });

      addLine(tab.id, {
        id: `sys-${Date.now()}`,
        content: `Connected. Room: ${data.roomId}`,
        type: "system",
        timestamp: new Date(),
      });
      return;
    }

    if (lower === "help") {
      addLine(tab.id, {
        id: `help-${Date.now()}`,
        content: `Commands:\nmy-address\nconnect-mate <code>\ncall   (start call after connecting)`,
        type: "system",
        timestamp: new Date(),
      });
      return;
    }

    // START CALL
    if (lower === "call" && (tab.type === "voice" || tab.type === "video")) {
      const roomId = tab.roomId;
      if (!roomId) {
        addLine(tab.id, {
          id: `err-${Date.now()}`,
          content: "Not connected. Use connect-mate first.",
          type: "error",
          timestamp: new Date(),
        });
        return;
      }

      if (!signalingRef.current || !signalingRef.current.isReady()) {
        addLine(tab.id, {
          id: `err-${Date.now()}`,
          content: "Signaling not ready. Wait a moment and try again.",
          type: "error",
          timestamp: new Date(),
        });
        return;
      }

      const callType: "voice" | "video" = tab.type;
      // const roomId: string = tab.roomId;

      console.log("📞 Starting call...");

      const rtc = new WebRTCClient();
      rtcMap.current.set(tab.id, rtc);

      await rtc.init(
        (c) => {
          signalingRef.current!.send(`/app/signaling/ice-candidate/${roomId}`, {
            senderId: user!.id,
            candidate: c,
            // callType: callType,
          });
        },
        (stream) => console.log("🎥 Remote stream ready", stream)
      );

      await rtc.openMedia(true, callType === "video");

      const offer = await rtc.createOffer();
      signalingRef.current!.send(`/app/signaling/offer/${roomId}`, {
        senderId: user!.id,
        sdpOffer: offer,
        callType: callType,
      });

      addLine(tab.id, {
        id: `call-${Date.now()}`,
        content: "📞 Calling...",
        type: "system",
        timestamp: new Date(),
      });

      console.log("🎬 Starting call UI");
      startCall(callType, roomId, tab.mateUsername || "Mate", rtc, tab.id);
      return;
    }

    // ===== CHAT MODE =====
    if (!tab.roomId) {
      addLine(tab.id, {
        id: `err-${Date.now()}`,
        content: `Not connected. Use my-address and connect-mate first.`,
        type: "error",
        timestamp: new Date(),
      });
    } else {
      if (wsClient && wsClient.isReady()) {
        wsClient.send(`/app/chat/send/${tab.roomId}`, {
          senderId: user!.id,
          senderUsername: user!.displayName,
          content: input,
        });
      } else {
        addLine(tab.id, {
          id: `msg-${Date.now()}`,
          content: input,
          type: "output",
          timestamp: new Date(),
        });
      }
    }

    setCommandInput(tab.id, "");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <Terminal ref={terminalRef} tab={tab} />
      <div className="border-t border-border bg-card p-4">
        <TerminalInput tab={tab} onCommand={handleCommand} />
      </div>
    </div>
  );
}