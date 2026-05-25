const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turns:openrelay.metered.ca:443',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;

  create(
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onTrack: (event: RTCTrackEvent) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void,
  ): RTCPeerConnection {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc.onicecandidate = ({ candidate }) => { if (candidate) onIceCandidate(candidate); };
    this.pc.ontrack = onTrack;
    this.pc.onconnectionstatechange = () => {
      if (this.pc) onConnectionStateChange(this.pc.connectionState);
    };
    return this.pc;
  }

  addStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => this.pc?.addTrack(track, stream));
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc!.createAnswer();
    await this.pc!.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
    await this.pc!.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
  }

  close(): void {
    this.pc?.close();
    this.pc = null;
  }

  get connectionState(): RTCPeerConnectionState | null {
    return this.pc?.connectionState ?? null;
  }
}
