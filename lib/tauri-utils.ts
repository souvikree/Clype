// lib/tauri-utils.ts
'use client';

import { invoke } from '@tauri-apps/api/core';
import { sendNotification } from '@tauri-apps/plugin-notification';

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// ============================================================================
// WINDOW CONTROLS
// ============================================================================

export const minimizeWindow = async () => {
  if (isTauri()) {
    await invoke('minimize_window');
  }
};

export const maximizeWindow = async () => {
  if (isTauri()) {
    await invoke('maximize_window');
  }
};

export const closeWindow = async () => {
  if (isTauri()) {
    await invoke('close_window');
  }
};

export const isWindowMaximized = async (): Promise<boolean> => {
  if (isTauri()) {
    return await invoke('is_maximized');
  }
  return false;
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const showNotification = async (title: string, body: string) => {
  if (isTauri()) {
    try {
      await sendNotification({ title, body });
    } catch (error) {
      console.error('Notification error:', error);
    }
  }
};

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const getApiUrl = () => {
  // Use environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://13.127.127.109:8080/api';
};


export const getWebSocketUrl = () => {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/^http/, 'ws');
};

// ============================================================================
// OAUTH / DEEP-LINK SUPPORT (NEW)
// ============================================================================

/**
 * Open OAuth URL in external browser (desktop) or new tab (web)
 * @param url - OAuth authorization URL to open
 */
export const openOAuthUrl = async (url: string) => {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(url);
  } else {
    window.open(url, '_blank');
  }
};

/**
 * Listen for OAuth callback via deep-link (clype://oauth?code=xxx)
 * Only works in Tauri desktop environment
 * @param callback - Function to handle the deep-link URL
 * @returns Cleanup function to remove listener
 */
export const listenForOAuthCallback = async (
  callback: (url: string) => void
): Promise<(() => void) | null> => {
  if (isTauri()) {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen<string>('oauth-callback', (event) => {
      callback(event.payload);
    });
    return unlisten;
  }
  return null;
};

// ============================================================================
// SYSTEM TRAY (OPTIONAL)
// ============================================================================

/**
 * Update system tray tooltip text
 * Useful for showing call status (e.g., "In call with John")
 * @param status - Status text to display in tray tooltip
 */
export const updateTrayTooltip = async (status: string) => {
  if (isTauri()) {
    try {
      await invoke('update_tray_tooltip', { status });
    } catch (error) {
      console.error('Failed to update tray tooltip:', error);
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse OAuth callback URL to extract authorization code
 * @param url - Deep-link URL (e.g., clype://oauth?code=xxx&state=yyy)
 * @returns Object with code and state, or null if invalid
 */
export const parseOAuthCallback = (url: string): { code: string; state?: string } | null => {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');
    
    if (code) {
      return { code, state: state || undefined };
    }
    return null;
  } catch (error) {
    console.error('Failed to parse OAuth callback URL:', error);
    return null;
  }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Get platform-specific API URL
 * In production desktop builds, this might need to be different
 */
export const getPlatformApiUrl = () => {
  if (isTauri() && !isDevelopment()) {
    // Production desktop: use production API
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.clype.com';
  }
  return getApiUrl();
};

// ============================================================================
// TYPE EXPORTS (for TypeScript users)
// ============================================================================

export type OAuthCallbackData = {
  code: string;
  state?: string;
};

export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'in-call' | 'disconnected';