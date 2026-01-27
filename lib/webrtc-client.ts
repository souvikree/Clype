export class WebRTCClient {
  private pc!: RTCPeerConnection;
  private localStream!: MediaStream;
  private remoteStream = new MediaStream();
  private iceQueue: RTCIceCandidateInit[] = [];
  private onIce!: (c: RTCIceCandidateInit) => void;
  private onRemoteTrack?: (stream: MediaStream) => void;
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private dataArray?: Uint8Array;

  // ENHANCED: Added more STUN servers + TURN servers for better connectivity
  private iceServers = [
    // Your existing STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },

    // ADDED: More STUN servers for redundancy
    { urls: "stun:stun4.l.google.com:19302" },

    // ADDED: FREE TURN servers for firewall/NAT traversal
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ];

  async init(
    onIce: (c: RTCIceCandidateInit) => void,
    onRemoteTrack?: (stream: MediaStream) => void,
  ) {
    this.onIce = onIce;
    this.onRemoteTrack = onRemoteTrack;

    // ENHANCED: Better RTC configuration
    this.pc = new RTCPeerConnection({
      iceServers: this.iceServers,

      // ADDED: Improved configuration for stability
      iceCandidatePoolSize: 10, // Pre-gather candidates (faster connection)
      bundlePolicy: "max-bundle", // Use single connection (lower latency)
      rtcpMuxPolicy: "require", // Multiplexing for better performance
      iceTransportPolicy: "all", // Use both STUN and TURN
    });

    this.pc.addEventListener("track", () => {
      this.pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio") {
          const params = sender.getParameters();
          if (!params.encodings) params.encodings = [{}];

          params.degradationPreference =
            "maintain-framerate" as RTCDegradationPreference;
          params.encodings[0].maxBitrate = 128000;
          params.encodings[0].priority = "high";
          params.encodings[0].networkPriority = "high";

          sender.setParameters(params).catch(console.warn);
        }
      });
    });
    // Your existing onicecandidate handler (preserved)
    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.onIce(e.candidate.toJSON());
    };

    // Your existing ontrack handler (preserved + enhanced logging)
    this.pc.ontrack = (e) => {
      console.log(
        "🎥 Remote track received:",
        e.track.kind,
        e.track.getSettings(),
      );
      this.remoteStream.addTrack(e.track);
      this.onRemoteTrack?.(this.remoteStream);
    };

    // ADDED: Connection state monitoring for stability
    this.pc.onconnectionstatechange = () => {
      console.log("📡 Connection state:", this.pc.connectionState);
      if (this.pc.connectionState === "failed") {
        console.error("❌ Connection failed, attempting ICE restart");
        this.pc.restartIce();
      }
    };

    // ADDED: ICE connection monitoring
    this.pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE state:", this.pc.iceConnectionState);
    };

    return this.pc;
  }

  async openMedia(audio: boolean, video: boolean) {
    // ENHANCED: Production-grade audio constraints
    const audioConstraints = audio
      ? ({
          // Your existing settings (preserved)
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
          sampleSize: 16,
          latency: 0.01,

          // Chrome high quality processing
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false,
        } as any)
      : false;

    // ENHANCED: Production-grade video constraints
    const videoConstraints = video
      ? ({
          // Your existing settings (preserved + enhanced)
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: "user",
          aspectRatio: { ideal: 16 / 9 },
          resizeMode: "crop-and-scale",
          // advanced: [{ noiseReduction: true }],
        } as MediaTrackConstraints)
      : false;

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: videoConstraints,
    });
    // === AUDIO NORMALIZATION (prevents long word cut-off) ===
    if (audio) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(this.localStream);
      const compressor = audioContext.createDynamicsCompressor();

      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      source.connect(compressor);

      const destination = audioContext.createMediaStreamDestination();
      compressor.connect(destination);

      // Replace original audio track with compressed one
      const compressedTrack = destination.stream.getAudioTracks()[0];
      this.localStream
        .getAudioTracks()
        .forEach((t) => this.localStream.removeTrack(t));
      this.localStream.addTrack(compressedTrack);
    }

    // ADDED: Log actual settings for debugging
    if (audio) {
      console.log(
        "🎤 Audio settings:",
        this.localStream.getAudioTracks()[0]?.getSettings(),
      );
    }
    if (video) {
      console.log(
        "📹 Video settings:",
        this.localStream.getVideoTracks()[0]?.getSettings(),
      );
    }

    // Your existing track adding logic (preserved + ENHANCED with better parameters)
    this.localStream.getTracks().forEach((track) => {
      const sender = this.pc.addTrack(track, this.localStream);

      // ENHANCED: Better video encoding parameters
      if (track.kind === "video") {
        const params = sender.getParameters();
        if (!params.encodings) params.encodings = [{}];

        const encoding = params.encodings[0];
        encoding.maxBitrate = 2500000;
        encoding.maxFramerate = 30;
        encoding.scaleResolutionDownBy = 1;
        encoding.priority = "high";
        encoding.networkPriority = "high";

        params.degradationPreference =
          "maintain-resolution" as RTCDegradationPreference;

        sender.setParameters(params).catch(console.warn);
      }

      // ENHANCED: Better audio encoding parameters
      if (track.kind === "audio") {
        const params = sender.getParameters();
        if (!params.encodings) params.encodings = [{}];

        const encoding = params.encodings[0];
        encoding.maxBitrate = 128000; // 128 kbps Opus
        encoding.priority = "high";
        encoding.networkPriority = "high";

        sender.setParameters(params).catch(console.warn);
      }
    });

    // Your existing audio analyzer setup (preserved)
    if (audio) {
      this.setupAudioAnalyzer();
    }

    return this.localStream;
  }

  // Your existing setupAudioAnalyzer (preserved + ENHANCED + TypeScript fixed)
  private setupAudioAnalyzer() {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();

      // ENHANCED: Better FFT settings
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // FIXED: TypeScript error - proper Uint8Array initialization
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      const source = this.audioContext.createMediaStreamSource(
        this.localStream,
      );
      source.connect(this.analyser);
    } catch (err) {
      console.warn("Audio analyzer setup failed:", err);
    }
  }

  // Your existing getAudioData (preserved exactly as-is)
  getAudioData(): number[] {
    if (!this.analyser || !this.dataArray) return Array(20).fill(0);

    this.analyser.getByteFrequencyData(this.dataArray as any);

    // Convert to 20 bars
    const bars = 20;
    const result: number[] = [];
    const samplesPerBar = Math.floor(this.dataArray.length / bars);

    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < samplesPerBar; j++) {
        sum += this.dataArray[i * samplesPerBar + j];
      }
      result.push(sum / samplesPerBar / 255);
    }

    return result;
  }

  // ENHANCED: Better offer creation (TypeScript safe)
  async createOffer() {
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
      iceRestart: false,
    });

    await this.pc.setLocalDescription(offer);
    return offer;
  }

  // ENHANCED: Better answer creation (TypeScript safe)
  async createAnswer() {
    const answer = await this.pc.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.pc.setLocalDescription(answer);
    return answer;
  }

  // Your existing setRemote (preserved exactly as-is)
  async setRemote(desc: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(desc));
    this.iceQueue.forEach((c) =>
      this.pc.addIceCandidate(new RTCIceCandidate(c)),
    );
    this.iceQueue = [];
  }

  // Your existing addIce (preserved exactly as-is)
  async addIce(c: RTCIceCandidateInit) {
    if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(c));
    } else {
      this.iceQueue.push(c);
    }
  }

  // Your existing getSignalingState (preserved exactly as-is)
  getSignalingState() {
    return this.pc.signalingState;
  }

  // Your existing getLocalStream (preserved exactly as-is)
  getLocalStream() {
    return this.localStream;
  }

  // Your existing getRemoteStream (preserved exactly as-is)
  getRemoteStream() {
    return this.remoteStream;
  }

  // ENHANCED: Better latency calculation
  async getLatency(): Promise<number> {
    if (!this.pc) return 0;

    const stats = await this.pc.getStats();
    let rtt = 0;

    stats.forEach((report) => {
      if (
        report.type === "candidate-pair" &&
        report.state === "succeeded" &&
        report.currentRoundTripTime
      ) {
        rtt = Math.round(report.currentRoundTripTime * 1000);
      }
    });

    return rtt;
  }

  // ENHANCED: Better bitrate calculation
  async getBitrate(): Promise<{ video: number; audio: number }> {
    if (!this.pc) return { video: 0, audio: 0 };

    const stats = await this.pc.getStats();
    let videoBitrate = 0;
    let audioBitrate = 0;

    stats.forEach((report) => {
      if (report.type === "outbound-rtp" && report.bytesSent) {
        const bitrate = Math.round((report.bytesSent * 8) / 1000);
        if (report.mediaType === "video") {
          videoBitrate = bitrate;
        } else if (report.mediaType === "audio") {
          audioBitrate = bitrate;
        }
      }
    });

    return { video: videoBitrate, audio: audioBitrate };
  }

  // Your existing getFPS (preserved exactly as-is)
  async getFPS(): Promise<number> {
    if (!this.pc) return 0;

    const stats = await this.pc.getStats();
    let fps = 0;

    stats.forEach((report) => {
      if (report.type === "outbound-rtp" && report.mediaType === "video") {
        fps = report.framesPerSecond || 0;
      }
    });

    return Math.round(fps);
  }

  // ADDED: NEW METHOD - Get detailed quality statistics
  async getQualityStats(): Promise<{
    packetLoss: number;
    jitter: number;
    bandwidth: number;
    quality: "excellent" | "good" | "fair" | "poor";
  }> {
    if (!this.pc)
      return { packetLoss: 0, jitter: 0, bandwidth: 0, quality: "poor" };

    const stats = await this.pc.getStats();
    let packetLoss = 0;
    let jitter = 0;
    let bandwidth = 0;

    stats.forEach((report) => {
      // Calculate packet loss from inbound RTP
      if (report.type === "inbound-rtp") {
        const lost = report.packetsLost || 0;
        const received = report.packetsReceived || 0;
        if (received > 0) {
          packetLoss = (lost / (lost + received)) * 100;
        }

        // Get jitter (in milliseconds)
        jitter = (report.jitter || 0) * 1000;
      }

      // Get available bandwidth from candidate pair
      if (report.type === "candidate-pair" && report.state === "succeeded") {
        bandwidth = Math.round((report.availableOutgoingBitrate || 0) / 1000); // kbps
      }
    });

    // Determine quality level
    let quality: "excellent" | "good" | "fair" | "poor";
    if (packetLoss < 1 && jitter < 30) {
      quality = "excellent";
    } else if (packetLoss < 3 && jitter < 50) {
      quality = "good";
    } else if (packetLoss < 5 && jitter < 100) {
      quality = "fair";
    } else {
      quality = "poor";
    }

    return {
      packetLoss: Math.round(packetLoss * 10) / 10,
      jitter: Math.round(jitter),
      bandwidth,
      quality,
    };
  }

  // Your existing close method (preserved exactly as-is)
  close() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.pc.close();
  }
}
