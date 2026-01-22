export class WebRTCClient {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  constructor() {}

  async initializePeerConnection(): Promise<RTCPeerConnection> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    })

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE Candidate:', event.candidate)
      }
    }

    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind)
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream()
      }
      this.remoteStream.addTrack(event.track)
    }

    return this.peerConnection
  }

  async getLocalStream(options: { audio?: boolean; video?: boolean } = {}): Promise<MediaStream> {
    const { audio = true, video = true } = options

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    })

    if (this.peerConnection && this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!)
      })
    }

    return this.localStream
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized')

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized')

    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized')
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description))
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized')
    if (candidate.candidate) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  getLocalStream_(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  closeConnection(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection
  }
}
