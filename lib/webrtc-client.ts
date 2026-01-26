export class WebRTCClient {
  private pc!: RTCPeerConnection
  private localStream!: MediaStream
  private remoteStream = new MediaStream()
  private iceQueue: RTCIceCandidateInit[] = []
  private onIce!: (c: RTCIceCandidateInit) => void
  private onRemoteTrack?: (stream: MediaStream) => void
  private audioContext?: AudioContext
  private analyser?: AnalyserNode
  private dataArray?: Uint8Array

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
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
    // Enhanced audio constraints for better quality
    const audioConstraints = audio ? {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2,
    } : false

    // Enhanced video constraints for better quality
    const videoConstraints = video ? {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'user',
    } : false

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: videoConstraints
    })

    // Add tracks with enhanced settings
    this.localStream.getTracks().forEach(track => {
      const sender = this.pc.addTrack(track, this.localStream)
      
      // Set encoding parameters for better quality
      if (track.kind === 'video') {
        const params = sender.getParameters()
        if (!params.encodings) params.encodings = [{}]
        params.encodings[0].maxBitrate = 2500000 // 2.5 Mbps
        sender.setParameters(params)
      }
      
      if (track.kind === 'audio') {
        const params = sender.getParameters()
        if (!params.encodings) params.encodings = [{}]
        params.encodings[0].maxBitrate = 128000 // 128 kbps
        sender.setParameters(params)
      }
    })

    // Setup audio analyzer for visualizations
    if (audio) {
      this.setupAudioAnalyzer()
    }

    return this.localStream
  }

  private setupAudioAnalyzer() {
    try {
      this.audioContext = new AudioContext()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 64 // 32 bars for visualization
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
  
      const source = this.audioContext.createMediaStreamSource(this.localStream)
      source.connect(this.analyser)
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    } catch (err) {
      console.warn('Audio analyzer setup failed:', err)
    }
  }

  getAudioData(): number[] {
    if (!this.analyser || !this.dataArray) return Array(20).fill(0)

  this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array 



    
    // Convert to 20 bars
    const bars = 20
    const result: number[] = []
    const samplesPerBar = Math.floor(this.dataArray.length / bars)
    
    for (let i = 0; i < bars; i++) {
      let sum = 0
      for (let j = 0; j < samplesPerBar; j++) {
        sum += this.dataArray[i * samplesPerBar + j]
      }
      result.push(sum / samplesPerBar / 255) 
    }
    
    return result
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

  async getLatency(): Promise<number> {
    if (!this.pc) return 0

    const stats = await this.pc.getStats()
    let rtt = 0

    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
        rtt = Math.round(report.currentRoundTripTime * 1000)
      }
    })

    return rtt
  }

  async getBitrate(): Promise<{ video: number; audio: number }> {
    if (!this.pc) return { video: 0, audio: 0 }

    const stats = await this.pc.getStats()
    let videoBitrate = 0
    let audioBitrate = 0

    stats.forEach(report => {
      if (report.type === 'outbound-rtp') {
        const bitrate = report.bytesSent ? (report.bytesSent * 8) / 1000 : 0
        if (report.mediaType === 'video') {
          videoBitrate = Math.round(bitrate)
        } else if (report.mediaType === 'audio') {
          audioBitrate = Math.round(bitrate)
        }
      }
    })

    return { video: videoBitrate, audio: audioBitrate }
  }

  async getFPS(): Promise<number> {
    if (!this.pc) return 0

    const stats = await this.pc.getStats()
    let fps = 0

    stats.forEach(report => {
      if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
        fps = report.framesPerSecond || 0
      }
    })

    return Math.round(fps)
  }

  close() {
    this.localStream?.getTracks().forEach(t => t.stop())
    this.audioContext?.close()
    this.pc.close()
  }
}