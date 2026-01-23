"use client";

import { useEffect, useRef, useState } from "react";
import { TerminalTab } from "@/lib/terminal-store";
import { useTerminalStore } from "@/lib/terminal-store";
import { useAuthStore } from "@/lib/auth-store";
import { Terminal } from "./terminal-display";
import { TerminalInput } from "./terminal-input";
import { WebSocketClient } from "@/lib/websocket-client";

export function TerminalEditor({ tab }: { tab: TerminalTab }) {
  const { addLine, setCommandInput, updateTab } = useTerminalStore();
  const { user, token } = useAuthStore();
  const terminalRef = useRef<HTMLDivElement>(null);

  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [subId, setSubId] = useState<string | null>(null);

  const [socketReady, setSocketReady] = useState(false);
  const pendingQueue = useRef<string[]>([]);

  // Auto scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [tab.history]);

  useEffect(() => {
    if (!tab.roomId || wsClient) return;

    const client = new WebSocketClient(
      `${process.env.NEXT_PUBLIC_WS_URL}/chat`,
      token!,
    );

    client.connect(
      () => {
        const id = client.subscribe(`/room/${tab.roomId}/messages`, (msg) => {
          const data = JSON.parse(msg.body);

          addLine(tab.id, {
            id: `msg-${Date.now()}`,
            content: data.content,
            type: "message",
            author: data.senderUsername,
            timestamp: new Date(data.createdAt),
          });
        });

        setSubId(id);

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

    return () => {
      if (subId) client.unsubscribe(subId);
      client.disconnect();
    };
  }, [tab.roomId]);

  const sendChat = (text: string) => {
    if (!wsClient || !tab.roomId) return;

    if (!wsClient.isReady()) {
      pendingQueue.current.push(text);
      addLine(tab.id, {
        id: `sys-${Date.now()}`,
        content: "Connecting... message queued",
        type: "system",
        timestamp: new Date(),
      });
      return;
    }

    wsClient.send(`/app/chat/send/${tab.roomId}`, {
      senderId: user!.id,
      senderUsername: user!.displayName,
      content: text,
    });
  };

  const handleCommand = async (input: string) => {
    if (!input.trim()) return;

    const command = input.trim();
    const lower = command.toLowerCase();

    addLine(tab.id, {
      id: `cmd-${Date.now()}`,
      content: `${tab.username} : ${tab.type} > ${input}`,
      type: "prompt",
      timestamp: new Date(),
    });

    // ===== SYSTEM =====
    if (lower === "my-address") {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rooms/my-address/${tab.type}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const text = await res.text();
        addLine(tab.id, {
          id: `err-${Date.now()}`,
          content: `my-address failed: ${text || res.status}`,
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
    } else if (lower.startsWith("connect-mate ")) {
      const mateCode = command
        .substring("connect-mate ".length)
        .trim()
        .toUpperCase();

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
        },
      );

      if (!res.ok) {
        const text = await res.text();
        addLine(tab.id, {
          id: `err-${Date.now()}`,
          content: `Connection failed: ${text || "Invalid code or session not ready"}`,
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
    } else if (command === "help") {
      addLine(tab.id, {
        id: `help-${Date.now()}`,
        content: `Commands:
my-address
connect-mate <code>
Type any text after pairing to chat`,
        type: "system",
        timestamp: new Date(),
      });
    }

    // ===== CHAT MODE =====
    else {
      if (!tab.roomId) {
        addLine(tab.id, {
          id: `err-${Date.now()}`,
          content: `Not connected. Use my-address and connect-mate first.`,
          type: "error",
          timestamp: new Date(),
        });
      } else {
        sendChat(input);
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
