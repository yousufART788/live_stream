const socket = io();

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const toggleStreamBtn = document.getElementById('toggleStream');
const inviteBtn = document.getElementById('inviteBtn');

let isStreaming = false;

toggleStreamBtn.addEventListener('click', () => {
  if (isStreaming) {
    stopStream();
  } else {
    startStream();
  }
});

inviteBtn.addEventListener('click', () => {
  const viewerId = prompt('Enter viewer ID to invite:');
  if (viewerId) {
    socket.emit('invite-viewer', viewerId);
  }
});

function startStream() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
      localVideo.srcObject = stream;

      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      const peerConnection = new RTCPeerConnection(configuration);

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          socket.emit('offer', peerConnection.localDescription);
        });

      socket.on('answer', (answer) => {
        peerConnection.setRemoteDescription(answer);
      });

      peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
      };

      isStreaming = true;
      toggleStreamBtn.innerText = 'Stop Streaming';
    })
    .catch((error) => console.error(error));
}

function stopStream() {
  // Close the stream and cleanup
  const stream = localVideo.srcObject;
  const tracks = stream.getTracks();

  tracks.forEach(track => track.stop());

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  isStreaming = false;
  toggleStreamBtn.innerText = 'Start Streaming';
}

// Handle invitations
socket.on('invitation', (streamerId) => {
  const acceptInvitation = confirm('You have been invited to join the stream. Do you want to accept?');
  if (acceptInvitation) {
    socket.emit('accept-invitation', streamerId);
  }
});

// Handle viewer joined
socket.on('viewer-joined', (viewerId) => {
  alert(`Viewer ${viewerId} has joined the stream.`);
});

// Handle viewer disconnected
socket.on('viewer-disconnected', (viewerId) => {
  alert(`Viewer ${viewerId} has disconnected from the stream.`);
});
