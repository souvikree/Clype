import { create } from "zustand";
import { WebRTCClient } from "./webrtc-client";

export interface TerminalTab {
  id: string;
  type: "chat" | "voice" | "video";
  username: string;
  isActive: boolean;
  roomId?: string;
  sessionId?: string;
  sessionCode?: string;
  history: TerminalLine[];
  commandInput: string;
  mateUsername?: string;
}

export interface TerminalLine {
  id: string;
  content: string;
  type: "prompt" | "output" | "message" | "error" | "system";
  author?: string;
  timestamp: Date;
  icon?: "success" | "info" | "error" | "call" | "signal"; // 🔥 NEW
}

export interface CallState {
  active: boolean;
  type: "voice" | "video" | null;
  roomId?: string;
  peerName?: string;
  isIncoming?: boolean;
  webrtcPeer?: WebRTCClient;
  tabId?: string;
  status?: "READY" | "RINGING" | "IN_CALL";
  latency?: number;
}

export interface TerminalStore {
  tabs: TerminalTab[];
  activeTabId: string | null;
  username: string;
  call: CallState;

  setUsername: (username: string) => void;
  addTab: (type: "chat" | "voice" | "video") => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  addLine: (tabId: string, line: TerminalLine) => void;
  setCommandInput: (tabId: string, input: string) => void;
  updateTab: (id: string, updates: Partial<TerminalTab>) => void;
  clearTabs: () => void;

  startCall: (
    type: "voice" | "video",
    roomId: string,
    peerName: string,
    peer: WebRTCClient,
    tabId: string,
  ) => void;
  receiveCall: (
    type: "voice" | "video",
    roomId: string,
    peerName: string,
    peer: WebRTCClient,
    tabId: string,
  ) => void;
  endCall: () => void;
}

let tabCounter = 0;

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  username: "",
  call: {
    active: false,
    type: null,
  },

  setUsername: (username: string) => set({ username }),

  addTab: (type) => {
    const { tabs, username } = get();
    const newTab: TerminalTab = {
      id: `tab-${++tabCounter}`,
      type,
      username,
      isActive: true,
      history: [
        {
          id: `line-0`,
          content: `${username} : ${type.charAt(0).toUpperCase() + type.slice(1)} >`,
          type: "prompt",
          timestamp: new Date(),
        },
      ],
      commandInput: "",
    };

    const updatedTabs = tabs.map((tab) => ({ ...tab, isActive: false }));
    updatedTabs.push(newTab);

    set({ tabs: updatedTabs, activeTabId: newTab.id });
  },

  removeTab: (id) => {
    const { tabs, call } = get();

    if (call.active && call.tabId === id) {
      get().endCall();
    }

    const updatedTabs = tabs.filter((tab) => tab.id !== id);

    let newActiveId = null;
    if (updatedTabs.length > 0) {
      newActiveId = updatedTabs[0].id;
      updatedTabs[0].isActive = true;
    }

    set({ tabs: updatedTabs, activeTabId: newActiveId });
  },

  setActiveTab: (id) => {
    const { tabs } = get();
    const updatedTabs = tabs.map((tab) => ({
      ...tab,
      isActive: tab.id === id,
    }));
    set({ tabs: updatedTabs, activeTabId: id });
  },

  addLine: (tabId, line) => {
    const { tabs } = get();
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === tabId) {
        return {
          ...tab,
          history: [...tab.history, line],
        };
      }
      return tab;
    });
    set({ tabs: updatedTabs });
  },

  setCommandInput: (tabId, input) => {
    const { tabs } = get();
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === tabId) {
        return { ...tab, commandInput: input };
      }
      return tab;
    });
    set({ tabs: updatedTabs });
  },

  updateTab: (id, updates) => {
    const { tabs } = get();
    const updatedTabs = tabs.map((tab) =>
      tab.id === id ? { ...tab, ...updates } : tab,
    );
    set({ tabs: updatedTabs });
  },

  clearTabs: () => {
    set({ tabs: [], activeTabId: null });
  },

  startCall: (type, roomId, peerName, peer, tabId) =>
    set({
      call: {
        active: true,
        type,
        roomId,
        peerName,
        isIncoming: false,
        webrtcPeer: peer,
        tabId,
        status: "RINGING",
      },
    }),

  receiveCall: (type, roomId, peerName, peer, tabId) =>
    set({
      call: {
        active: true,
        type,
        roomId,
        peerName,
        isIncoming: true,
        webrtcPeer: peer,
        tabId,
        status: "RINGING",
      },
    }),

  endCall: () => {
    const { call } = get();
    call.webrtcPeer?.close();
    set({
      call: {
        active: false,
        type: null,
        status: "READY",
      },
    });
  },
}));
