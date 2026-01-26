import SockJS from 'sockjs-client'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'

export class WebSocketClient {
  private client: Client
  private connected = false
  private subscriptions = new Map<string, StompSubscription>()
  private onStatusChange?: (online: boolean) => void

  private lastPing = 0
  private pingTimer?: NodeJS.Timeout

  constructor(private url: string, private token: string) {
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.url),
      connectHeaders: {
        Authorization: `Bearer ${this.token}`,
      },
      debug: (str) => console.log('[STOMP]', str),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })
  }

  // ===== STATUS =====
  onConnectionStatus(cb: (online: boolean) => void) {
    this.onStatusChange = cb
  }

  isReady() {
    return this.connected
  }

  getPing() {
    return this.lastPing
  }

  // ===== REAL RTT PING =====
  private startPing() {
    this.stopPing()

    this.pingTimer = setInterval(() => {
      if (!this.connected) return

      const receiptId = `ping-${Date.now()}`
      const start = performance.now()

      this.client.watchForReceipt(receiptId, () => {
        this.lastPing = Math.round(performance.now() - start)
      })

      this.client.publish({
        destination: '/app/ping',
        body: 'ping',
        headers: { receipt: receiptId }
      })
    }, 3000)
  }

  private stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer)
  }

  // ===== CONNECTION =====
  connect(onReady: () => void, onError: (e: any) => void) {
    if (this.client.active) return

    this.client.onConnect = () => {
      this.connected = true
      this.onStatusChange?.(true)
      this.startPing()
      onReady()
    }

    this.client.onStompError = (frame) => {
      this.connected = false
      this.stopPing()
      this.onStatusChange?.(false)
      onError(frame)
    }

    this.client.onWebSocketClose = () => {
      this.connected = false
      this.stopPing()
      this.onStatusChange?.(false)
    }

    this.client.activate()
  }

  // ===== STOMP API =====
  subscribe(dest: string, cb: (m: IMessage) => void): string {
    if (!this.connected) throw new Error('STOMP not connected')
    const sub = this.client.subscribe(dest, cb)
    this.subscriptions.set(sub.id, sub)
    return sub.id
  }

  send(dest: string, body: any) {
    if (!this.connected) throw new Error('STOMP not ready')
    this.client.publish({ destination: dest, body: JSON.stringify(body) })
  }

  disconnect() {
    this.subscriptions.forEach(s => s.unsubscribe())
    this.subscriptions.clear()
    this.stopPing()
    this.client.deactivate()
    this.connected = false
    this.onStatusChange?.(false)
  }
}
