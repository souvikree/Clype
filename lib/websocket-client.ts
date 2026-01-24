import SockJS from 'sockjs-client'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'

export class WebSocketClient {
  private client: Client
  private connected = false
  private subscriptions = new Map<string, StompSubscription>()

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

  connect(onReady: () => void, onError: (e: any) => void) {
    if (this.client.active) return

    this.client.onConnect = () => {
      this.connected = true
      console.log('STOMP CONNECTED')
      onReady()
    }

    this.client.onStompError = (frame) => {
      this.connected = false
      console.error('STOMP ERROR', frame)
      onError(frame)
    }

    this.client.onWebSocketClose = () => {
      this.connected = false
      console.warn('STOMP DISCONNECTED')
    }

    this.client.activate()
  }

  isReady() {
    return this.connected
  }

  subscribe(dest: string, cb: (m: IMessage) => void): string {
    if (!this.connected) throw new Error('STOMP not connected')
    const sub = this.client.subscribe(dest, cb)
    this.subscriptions.set(sub.id, sub)
    return sub.id
  }

  unsubscribe(id: string) {
    const sub = this.subscriptions.get(id)
    if (sub) {
      sub.unsubscribe()
      this.subscriptions.delete(id)
    }
  }

  send(dest: string, body: any) {
    if (!this.connected) throw new Error('STOMP not ready')
    this.client.publish({ destination: dest, body: JSON.stringify(body) })
  }

  disconnect() {
    this.subscriptions.forEach(s => s.unsubscribe())
    this.subscriptions.clear()
    this.client.deactivate()
    this.connected = false
  }
}



// import SockJS from 'sockjs-client'
// import { Client, IMessage, StompSubscription } from '@stomp/stompjs'

// export class WebSocketClient {
//   private client: Client
//   private connected = false
//   private subscriptions = new Map<string, StompSubscription>()

//   constructor(private url: string, private token: string) {
//     this.client = new Client({
//       webSocketFactory: () => new SockJS(this.url),
//       connectHeaders: {
//         Authorization: `Bearer ${this.token}`,
//       },
//       debug: (str) => console.log('[STOMP]', str),
//       reconnectDelay: 3000,
//       heartbeatIncoming: 4000,
//       heartbeatOutgoing: 4000,
//     })
//   }

//   connect(onReady: () => void, onError: (e: any) => void) {
//     if (this.client.active) return

//     this.client.onConnect = () => {
//       this.connected = true
//       console.log('STOMP CONNECTED')
//       onReady()
//     }

//     this.client.onStompError = (frame) => {
//       this.connected = false
//       console.error('STOMP ERROR', frame)
//       onError(frame)
//     }

//     this.client.onWebSocketClose = () => {
//       this.connected = false
//       console.warn('STOMP DISCONNECTED')
//     }

//     this.client.activate()
//   }

//   isReady() {
//     return this.connected
//   }

//   subscribe(dest: string, cb: (m: IMessage) => void): string {
//     if (!this.connected) throw new Error('STOMP not connected')
//     const sub = this.client.subscribe(dest, cb)
//     this.subscriptions.set(sub.id, sub)
//     return sub.id
//   }

//   unsubscribe(id: string) {
//     const sub = this.subscriptions.get(id)
//     if (sub) {
//       sub.unsubscribe()
//       this.subscriptions.delete(id)
//     }
//   }

//   send(dest: string, body: any) {
//     if (!this.connected) throw new Error('STOMP not ready')
//     this.client.publish({ destination: dest, body: JSON.stringify(body) })
//   }

//   disconnect() {
//     this.subscriptions.forEach(s => s.unsubscribe())
//     this.subscriptions.clear()
//     this.client.deactivate()
//     this.connected = false
//   }
// }
