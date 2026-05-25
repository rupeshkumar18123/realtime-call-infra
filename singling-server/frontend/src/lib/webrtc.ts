// const ICE_SERVERS: RTCIceServer[] = [
//   { urls: 'stun:stun.l.google.com:19302' },
//   { urls: 'stun:stun1.l.google.com:19302' },
//   {
//     urls: [
//       'turn:openrelay.metered.ca:80',
//       'turn:openrelay.metered.ca:443',
//       'turns:openrelay.metered.ca:443',
//     ],
//     username: 'openrelayproject',
//     credential: 'openrelayproject',
//   },
// ];

// export class WebRTCService {
//   private pc: RTCPeerConnection | null = null;

//   create(
//     onIceCandidate: (candidate: RTCIceCandidate) => void,
//     onTrack: (event: RTCTrackEvent) => void,
//     onConnectionStateChange: (state: RTCPeerConnectionState) => void,
//   ): RTCPeerConnection {
//     this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
//     this.pc.onicecandidate = ({ candidate }) => { if (candidate) onIceCandidate(candidate); };
//     this.pc.ontrack = onTrack;
//     this.pc.onconnectionstatechange = () => {
//       if (this.pc) onConnectionStateChange(this.pc.connectionState);
//     };
//     return this.pc;
//   }

//   addStream(stream: MediaStream): void {
//     stream.getTracks().forEach((track) => this.pc?.addTrack(track, stream));
//   }

//   async createOffer(): Promise<RTCSessionDescriptionInit> {
//     const offer = await this.pc!.createOffer();
//     await this.pc!.setLocalDescription(offer);
//     return offer;
//   }

//   async createAnswer(): Promise<RTCSessionDescriptionInit> {
//     const answer = await this.pc!.createAnswer();
//     await this.pc!.setLocalDescription(answer);
//     return answer;
//   }

//   async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
//     await this.pc!.setRemoteDescription(new RTCSessionDescription(sdp));
//   }

//   async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
//     await this.pc!.addIceCandidate(new RTCIceCandidate(candidate));
//   }

//   close(): void {
//     this.pc?.close();
//     this.pc = null;
//   }

//   get connectionState(): RTCPeerConnectionState | null {
//     return this.pc?.connectionState ?? null;
//   }
// }




const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: 'stun:stun.l.google.com:19302',
  },
  {
    urls: 'stun:stun1.l.google.com:19302',
  },
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
    onConnectionStateChange: (
      state: RTCPeerConnectionState,
    ) => void,
  ): RTCPeerConnection {
    this.pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('Generated ICE candidate');
        onIceCandidate(candidate);
      }
    };

    this.pc.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind);
      onTrack(event);
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        console.log(
          'Connection State:',
          this.pc.connectionState,
        );

        onConnectionStateChange(this.pc.connectionState);
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(
        'ICE Connection State:',
        this.pc?.iceConnectionState,
      );
    };

    this.pc.onicegatheringstatechange = () => {
      console.log(
        'ICE Gathering State:',
        this.pc?.iceGatheringState,
      );
    };

    this.pc.onnegotiationneeded = () => {
      console.log('Negotiation needed');
    };

    return this.pc;
  }

  addStream(stream: MediaStream): void {
    if (!this.pc) {
      console.error('PeerConnection not initialized');
      return;
    }

    stream.getTracks().forEach((track) => {
      console.log('Adding local track:', track.kind);

      this.pc?.addTrack(track, stream);
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) {
      throw new Error('PeerConnection not initialized');
    }

    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.pc.setLocalDescription(offer);

    console.log('Offer created');

    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) {
      throw new Error('PeerConnection not initialized');
    }

    const answer = await this.pc.createAnswer();

    await this.pc.setLocalDescription(answer);

    console.log('Answer created');

    return answer;
  }

  async setRemoteDescription(
    sdp: RTCSessionDescriptionInit,
  ): Promise<void> {
    if (!this.pc) {
      throw new Error('PeerConnection not initialized');
    }

    await this.pc.setRemoteDescription(
      new RTCSessionDescription(sdp),
    );

    console.log('Remote description applied');
  }

  async addIceCandidate(
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    if (!this.pc) {
      console.error('PeerConnection not initialized');
      return;
    }

    try {
      await this.pc.addIceCandidate(
        new RTCIceCandidate(candidate),
      );

      console.log('ICE candidate added');
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  close(): void {
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;

      this.pc.close();

      this.pc = null;

      console.log('Peer connection closed');
    }
  }

  get connectionState(): RTCPeerConnectionState | null {
    return this.pc?.connectionState ?? null;
  }
}
