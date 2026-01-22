import SockJS from 'sockjs-client'
import { Client, IMessage } from '@stomp/stompjs'

export class WebSocketClient {
  private client: Client | null = null
  private url: string
  private token: string

  constructor(url: string, token: string) {
    this.url = url
    this.token = token
  }

  connect(onConnect: () => void, onError: (error: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        brokerURL: this.url,
        connectHeaders: {
          Authorization: `Bearer ${this.token}`,
        },
        debug: (str: string) => console.log('[WebSocket]', str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          onConnect()
          resolve()
        },
        onStompError: (frame: any) => {
          console.error('[WebSocket Error]', frame)
          onError(frame)
          reject(frame)
        },
      })

      this.client.activate()
    })
  }

  subscribe(destination: string, callback: (message: IMessage) => void): string {
    if (!this.client) throw new Error('WebSocket not connected')
    return this.client.subscribe(destination, callback).id
  }

  unsubscribe(subscriptionId: string): void {
    if (!this.client) return
    this.client.unsubscribe(subscriptionId)
  }

  send(destination: string, body: any): void {
    if (!this.client) throw new Error('WebSocket not connected')
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    })
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate()
      this.client = null
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false
  }
}
