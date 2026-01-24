export class WebRTCClient {
  private pc!: RTCPeerConnection
  private localStream!: MediaStream
  private remoteStream = new MediaStream()
  private iceQueue: RTCIceCandidateInit[] = []
  private onIce!: (c: RTCIceCandidateInit) => void
  private onRemoteTrack?: (stream: MediaStream) => void  

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  async init(
    onIce: (c: RTCIceCandidateInit) => void,
    onRemoteTrack?: (stream: MediaStream) => void  
  ) {
    this.onIce = onIce
    this.onRemoteTrack = onRemoteTrack
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers })

    this.pc.onicecandidate = e => {
      if (e.candidate) this.onIce(e.candidate.toJSON())
    }

    this.pc.ontrack = e => {
      console.log('🎥 Remote track received:', e.track.kind)
      this.remoteStream.addTrack(e.track)
      this.onRemoteTrack?.(this.remoteStream)  
    }

    return this.pc
  }

  async openMedia(audio: boolean, video: boolean) {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video })
    this.localStream.getTracks().forEach(t => this.pc.addTrack(t, this.localStream))
    return this.localStream
  }

  async createOffer() {
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    return offer
  }

  async createAnswer() {
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    return answer
  }

  async setRemote(desc: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(desc))
    this.iceQueue.forEach(c => this.pc.addIceCandidate(new RTCIceCandidate(c)))
    this.iceQueue = []
  }

  async addIce(c: RTCIceCandidateInit) {
    if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(c))
    } else {
      this.iceQueue.push(c)
    }
  }

  getSignalingState() {
    return this.pc.signalingState
  }
  
  getLocalStream() {
    return this.localStream
  }

  getRemoteStream() {
    return this.remoteStream
  }

  close() {
    this.localStream?.getTracks().forEach(t => t.stop())
    this.pc.close()
  }
}