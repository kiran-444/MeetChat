import React, { useEffect, useRef, useState } from "react";
import { Badge, IconButton, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { io } from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEnd from "@mui/icons-material/CallEnd";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import { ConnectWithoutContact } from "@mui/icons-material";
import styles from "../styles/videoComponent.module.css";
import { useNavigate } from "react-router-dom";

const server_url = "http://localhost:8000";

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeet() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState();
  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [message, setMessage] = useState("");
  let [messages, setMessages] = useState([]);
  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  // ─── ALL ORIGINAL LOGIC — UNTOUCHED ─────────────────────────────

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoPermission) { setVideoAvailable(true); } else { setVideoAvailable(false); }

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPermission) { setAudioAvailable(true); } else { setAudioAvailable(false); }

      if (navigator.mediaDevices.getDisplayMedia) { setScreenAvailable(true); } else { setScreenAvailable(false); }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => { getPermissions(); }, []);

  let getUserMediaSuccess = (stream) => {
    try { window.localStream.getTracks().forEach((track) => track.stop()); } catch (e) { console.log(e); }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
        }).catch((e) => console.log(e));
      });
    }
    stream.getTracks().forEach((track) => (track.onended = () => {
      setVideo(false);
      setAudio(false);
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) { console.log(e); }
      let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;
      for (let id in connections) {
        connections[id].addStream(window.localStream);
        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description).then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
          }).catch((e) => console.log(e));
        });
      }
    }));
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: true });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) { console.log(e); }
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) { getUserMedia(); }
  }, [audio, video]);

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === "offer") {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
              }).catch((e) => console.log(e));
            }).catch((e) => console.log(e));
          }
        }).catch((e) => console.log(e));
      }
      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) => console.log(e));
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { data, sender }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevMessages) => prevMessages + 1);
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on("chat-message", addMessage);
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });
      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
            }
          };
          connections[socketListId].onaddstream = (event) => {
            // Fix 1: Never add our own stream to the remote grid
            if (socketListId === socketIdRef.current) return;

            // Fix 2: Use functional updater so the find() always sees latest state,
            // preventing duplicate tiles when state batching behaves differently on mobile
            setVideos((prevVideos) => {
              const alreadyExists = prevVideos.find((v) => v.socketId === socketListId);
              if (alreadyExists) {
                const updatedVideos = prevVideos.map((v) =>
                  v.socketId === socketListId ? { ...v, stream: event.stream } : v
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              } else {
                const newVideo = { socketId: socketListId, stream: event.stream, autoPlay: true, playsInline: true };
                const updatedVideos = [...prevVideos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              }
            });
          };
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });
        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try { connections[id2].addStream(window.localStream); } catch (err) { console.log(err); }
            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", id2, JSON.stringify({ sdp: connections[id2].localDescription }));
              }).catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    // connectToSocketServer();
  };

  let routeTo = useNavigate();

  let connect = () => {
    setAskForUsername(false);
    getMedia();
    connectToSocketServer();
  };

  let handleVideo = () => { setVideo(!video); };
  let handleAudio = () => { setAudio(!audio); };

  let getDisplayMediaSuccess = (stream) => {
    try { window.localStream.getTracks().forEach((track) => track.stop()); } catch (e) { console.log(e); }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;
    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
        }).catch((e) => console.log(e));
      });
    }
    stream.getTracks().forEach((track) => (track.onended = () => {
      setScreen(false);
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) { console.log(e); }
      let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;
      getUserMedia();
    }));
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => { if (screen !== undefined) { getDisplayMedia(); } }, [screen]);

  let handleScreen = () => { setScreen(!screen); };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) { console.log(e); }
    routeTo("/home");
  };

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <div>
      {askForUsername === true ? (
        /* ── Lobby ── */
        <div className={styles.lobbyWrapper}>
          <div className={styles.lobbyCard}>
            <div className={styles.lobbyHeader}>
              <div className={styles.lobbyLogo}>
                <ConnectWithoutContact style={{ color: "white", fontSize: "1.6rem" }} />
              </div>
              <h2 className={styles.lobbyTitle}>Join the room</h2>
              <p className={styles.lobbySubtitle}>Enter your name to get started</p>
            </div>

            <div className={styles.lobbyPreview}>
              <video ref={localVideoRef} autoPlay muted />
            </div>

            <div className={styles.lobbyInputRow}>
              <TextField
                id="outlined-basic"
                label="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                fullWidth
                onKeyDown={(e) => e.key === "Enter" && connect()}
              />
              <Button
                variant="contained"
                onClick={connect}
                style={{
                  height: "56px",
                  padding: "0 28px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #4f8ef7, #6a4ff7)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 16px rgba(79,142,247,0.35)",
                  flexShrink: 0,
                }}
              >
                Connect
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Meet Room ── */
        <div className={styles.meetVideoContainer}>

          {/* Chat panel */}
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chatingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div style={{ marginBottom: "20px" }} key={index}>
                        <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chatingArea}>
                  <TextField
                    id="outlined-basic"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    label="Enter your chat"
                    variant="outlined"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          {/* Controls bar */}
          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton
              onClick={handleEndCall}
              style={{
                color: "white",
                width: "56px",
                height: "56px",
                background: "#f74f4f",
                border: "none",
                boxShadow: "0 4px 20px rgba(247,79,79,0.4)",
              }}
            >
              <CallEnd />
            </IconButton>

            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          {/* Local (self) video */}
          <video
            className={styles.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
          />

          {/* Remote participants grid — deduplicated and local stream excluded */}
          <div className={styles.conferenceView}>
            {[...new Map(
                videos
                  .filter((v) => v.socketId !== socketIdRef.current)
                  .map((v) => [v.socketId, v])
              ).values()
            ].map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}