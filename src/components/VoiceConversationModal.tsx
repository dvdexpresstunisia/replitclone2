import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Radio,
  Square,
  AlertCircle,
  FileCode,
  CornerDownLeft,
  Send,
  Video,
  VideoOff,
  ScreenShare,
  Camera,
  Maximize2,
  Minimize2,
  Eye,
  CameraOff,
  Layers,
  CheckCircle2,
  Activity
} from "lucide-react";
import { ProjectFile } from "../types";

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: ProjectFile | null;
  files: ProjectFile[];
  initialVisualMode?: "screen" | "camera" | null;
}

interface TranscriptItem {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
  isVisionEvent?: boolean;
}

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  isOpen,
  onClose,
  activeFile,
  files,
  initialVisualMode = null,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [statusText, setStatusText] = useState("Prêt à démarrer");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Visual Diffusion States
  const [isVisualActive, setIsVisualActive] = useState(false);
  const [visualSource, setVisualSource] = useState<"screen" | "camera" | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [videoResolution, setVideoResolution] = useState<string>("720p");
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [lastAckTime, setLastAckTime] = useState<number | null>(null);

  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: "t-init",
      sender: "gemini",
      text: "Bonjour ! Je suis Gemini en direct (gemini-3.8-live). Vous pouvez me parler à voix haute et activer la diffusion visuelle pour me montrer votre écran ou votre caméra en temps réel.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [textInput, setTextInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoFrameIntervalRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen]);

  // If opened with initial visual mode request
  useEffect(() => {
    if (isOpen && initialVisualMode && !isVisualActive) {
      if (initialVisualMode === "screen") {
        startVisualDiffusion("screen");
      } else if (initialVisualMode === "camera") {
        startVisualDiffusion("camera");
      }
    }
  }, [isOpen, initialVisualMode]);

  const startVoiceSession = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      setStatusText("Connexion à Gemini Live (gemini-3.8-live)...");

      // Setup WebSocket connection to backend live bridge
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Audio contexts: 16kHz for input (Gemini standard), 24kHz for output
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      audioStreamRef.current = stream;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatusText("Session Live active • En écoute");

        // Send initial context about active project and files
        const projectSummary = `Fichier actif: ${activeFile ? activeFile.name : "aucun"}\nContenu du fichier:\n${
          activeFile ? activeFile.content.slice(0, 2000) : ""
        }`;
        ws.send(JSON.stringify({ text: `[Contexte du projet RepliLite]: ${projectSummary}` }));

        // Start processing microphone audio
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (isMuted) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Detect user speech volume
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const avg = sum / inputData.length;
          setIsUserSpeaking(avg > 0.02);

          // Convert Float32 to 16-bit PCM little-endian
          const pcmBuffer = floatTo16BitPCM(inputData);
          const base64Audio = arrayBufferToBase64(pcmBuffer);

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };

        // If video stream was already prepared or active, start streaming frames
        if (videoStreamRef.current) {
          startFrameCaptureLoop();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "audio" && data.audio) {
            setIsSpeaking(true);
            setStatusText(
              isVisualActive
                ? "🔊 Gemini analyse votre flux visuel et vous répond..."
                : "🔊 Gemini vous répond en direct..."
            );
            playAudioChunk(outputCtx, data.audio);
          }

          if (data.type === "text" && data.text) {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `t-${Date.now()}-${Math.random()}`,
                sender: "gemini",
                text: data.text,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }

          if (data.type === "video_stream_ack") {
            setLastAckTime(Date.now());
          }

          if (data.type === "interrupted") {
            setIsSpeaking(false);
            setStatusText("Interrompu • En écoute...");
          }

          if (data.type === "error") {
            setErrorMessage(data.error);
            setStatusText("Erreur lors de la session");
          }
        } catch (err) {
          console.warn("Error handling live WS message", err);
        }
      };

      ws.onerror = (e) => {
        console.error("Live WebSocket error:", e);
        setErrorMessage("Erreur de connexion avec le service Gemini Live.");
        stopSession();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText("Session terminée");
      };
    } catch (err: any) {
      console.error("Could not start voice session:", err);
      setErrorMessage(
        err.message || "Impossible d'accéder au microphone ou de démarrer la session vocale."
      );
      stopSession();
    }
  };

  // Start visual diffusion (Screen Share or Camera)
  const startVisualDiffusion = async (sourceType: "screen" | "camera") => {
    try {
      setErrorMessage(null);

      // Stop previous video stream if any
      stopVisualDiffusionTracks();

      let stream: MediaStream;
      if (sourceType === "screen") {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            frameRate: { max: 15 },
          },
          audio: false,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });
      }

      videoStreamRef.current = stream;
      setVisualSource(sourceType);
      setIsVisualActive(true);
      setIsVideoPaused(false);

      // Attach to preview video element
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.play().catch(() => {});
      }

      // Detect track resolution
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setVideoResolution(`${settings.width}x${settings.height}`);
        }

        // Handle user stopping screen share natively via browser prompt
        videoTrack.onended = () => {
          stopVisualDiffusion();
        };
      }

      // Add notification to transcripts
      setTranscripts((prev) => [
        ...prev,
        {
          id: `t-vision-${Date.now()}`,
          sender: "user",
          text: `[Diffusion visuelle activée : ${sourceType === "screen" ? "Partage d'écran" : "Caméra"}]`,
          timestamp: new Date().toLocaleTimeString(),
          isVisionEvent: true,
        },
      ]);

      // If connected to WebSocket, start frame capture loop immediately
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        startFrameCaptureLoop();
      } else if (!isConnected && !isConnecting) {
        // Auto-start live session if not already connected
        startVoiceSession();
      }
    } catch (err: any) {
      console.warn("Could not start visual diffusion:", err);
      if (err.name !== "NotAllowedError") {
        setErrorMessage(
          err.message || "Impossible d'accéder au flux vidéo pour la diffusion visuelle."
        );
      }
      setIsVisualActive(false);
      setVisualSource(null);
    }
  };

  // Stop only the visual stream tracks
  const stopVisualDiffusionTracks = () => {
    if (videoFrameIntervalRef.current) {
      clearInterval(videoFrameIntervalRef.current);
      videoFrameIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
  };

  const stopVisualDiffusion = () => {
    stopVisualDiffusionTracks();
    setIsVisualActive(false);
    setVisualSource(null);
    setIsVideoPaused(false);

    setTranscripts((prev) => [
      ...prev,
      {
        id: `t-vision-stop-${Date.now()}`,
        sender: "user",
        text: "[Diffusion visuelle arrêtée]",
        timestamp: new Date().toLocaleTimeString(),
        isVisionEvent: true,
      },
    ]);
  };

  // Captures and streams frames periodically (1 frame per second = optimal for Gemini Vision Live)
  const startFrameCaptureLoop = () => {
    if (videoFrameIntervalRef.current) {
      clearInterval(videoFrameIntervalRef.current);
    }

    videoFrameIntervalRef.current = window.setInterval(() => {
      if (isVideoPaused) return;
      captureAndSendVideoFrame();
    }, 1000);
  };

  // Grab single frame from video element and send over WS to Gemini Live
  const captureAndSendVideoFrame = () => {
    const video = videoElementRef.current;
    if (!video || video.readyState < 2 || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      if (!captureCanvasRef.current) {
        captureCanvasRef.current = document.createElement("canvas");
      }
      const canvas = captureCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Scale to optimal dimensions (max 960px width to preserve bandwidth and maximize recognition)
      const targetWidth = Math.min(video.videoWidth || 960, 960);
      const ratio = targetWidth / (video.videoWidth || 1);
      const targetHeight = Math.round((video.videoHeight || 540) * ratio);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      // Convert to JPEG base64
      const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
      const base64Data = dataUrl.split(",")[1];

      if (base64Data) {
        wsRef.current.send(
          JSON.stringify({
            video: base64Data,
            mimeType: "image/jpeg",
            frameCount: frameCount + 1,
          })
        );
        setFrameCount((c) => c + 1);
      }
    } catch (err) {
      console.warn("Could not capture video frame:", err);
    }
  };

  // Immediate manual snapshot sent to Gemini
  const handleSendManualSnapshot = () => {
    if (!isVisualActive) return;
    captureAndSendVideoFrame();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          text: "[L'utilisateur vient d'envoyer un instantané de son écran/caméra : regarde attentivement et décris ce que tu vois]",
        })
      );
    }

    setTranscripts((prev) => [
      ...prev,
      {
        id: `t-snap-${Date.now()}`,
        sender: "user",
        text: "📸 [Instantané envoyé à Gemini]",
        timestamp: new Date().toLocaleTimeString(),
        isVisionEvent: true,
      },
    ]);
  };

  const stopSession = () => {
    stopVisualDiffusionTracks();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setIsUserSpeaking(false);
    setIsVisualActive(false);
    setVisualSource(null);
    setStatusText("Session arrêtée");
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ text: textInput.trim() }));
    setTranscripts((prev) => [
      ...prev,
      {
        id: `t-user-${Date.now()}`,
        sender: "user",
        text: textInput.trim(),
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setTextInput("");
  };

  // Utilities for Audio PCM conversion
  function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output.buffer;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function playAudioChunk(audioCtx: AudioContext, base64PCM: string) {
    try {
      const binaryString = atob(base64PCM);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const dataView = new DataView(bytes.buffer);
      const numSamples = Math.floor(len / 2);
      const float32Array = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / (int16 < 0 ? 32768 : 32767);
      }

      const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();

      source.onended = () => {
        setIsSpeaking(false);
      };
    } catch (playbackErr) {
      console.warn("Could not play audio chunk", playbackErr);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-[#273244] rounded-2xl w-full max-w-4xl h-[88vh] shadow-2xl flex flex-col overflow-hidden text-xs text-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#141924] border-b border-[#232c3d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Diffusion Visuelle & Vocal Live</h3>
                <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.2 rounded font-mono font-semibold">
                  gemini-3.8-live
                </span>
                {isVisualActive && (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 px-2 py-0.2 rounded font-semibold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Flux Visuel Actif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Parlez à l'IA et diffusez votre écran ou votre caméra en direct pour qu'elle voie votre code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Visual Diffusion Dropdown in header */}
            <div className="flex items-center gap-1 bg-[#1a2130] p-1 rounded-xl border border-[#2d384c]">
              <button
                onClick={() =>
                  isVisualActive && visualSource === "screen"
                    ? stopVisualDiffusion()
                    : startVisualDiffusion("screen")
                }
                title={
                  isVisualActive && visualSource === "screen"
                    ? "Arrêter le partage d'écran"
                    : "Diffuser l'écran à Gemini (Code, erreurs, preview)"
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  isVisualActive && visualSource === "screen"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-300 hover:text-white hover:bg-[#253046]"
                }`}
              >
                <ScreenShare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Partage Écran</span>
              </button>

              <button
                onClick={() =>
                  isVisualActive && visualSource === "camera"
                    ? stopVisualDiffusion()
                    : startVisualDiffusion("camera")
                }
                title={
                  isVisualActive && visualSource === "camera"
                    ? "Arrêter la caméra"
                    : "Diffuser la webcam à Gemini"
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  isVisualActive && visualSource === "camera"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-gray-300 hover:text-white hover:bg-[#253046]"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Caméra</span>
              </button>
            </div>

            <button
              onClick={() => {
                stopSession();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-[#20293b] text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Area: Split between Visual Stream Feed and Voice Wave */}
        <div className="bg-[#0b0e15] border-b border-[#1f2736] p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shrink-0">
          {/* Ambient Glow */}
          <div
            className={`absolute w-72 h-72 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none ${
              isSpeaking
                ? "bg-purple-600/20 opacity-100"
                : isVisualActive
                ? "bg-emerald-600/20 opacity-100"
                : isUserSpeaking
                ? "bg-blue-600/20 opacity-100"
                : "bg-gray-600/5 opacity-30"
            }`}
          />

          {/* Left/Main Column: Visual Diffusion Monitor HUD */}
          <div
            className={`relative z-10 transition-all duration-300 flex flex-col ${
              isVisualActive ? "w-full md:w-3/5" : "w-full md:w-auto"
            }`}
          >
            {isVisualActive ? (
              <div className="bg-[#121722] border border-[#263348] rounded-xl overflow-hidden shadow-2xl relative">
                {/* HUD Header Bar */}
                <div className="px-3 py-1.5 bg-[#171f2d] border-b border-[#243044] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">
                      {visualSource === "screen" ? "Écran diffusé" : "Caméra diffusée"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {videoResolution} • 1 FPS
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">
                      {frameCount} trames
                    </span>
                    <button
                      onClick={handleSendManualSnapshot}
                      title="Envoyer un instantané immédiat à l'IA"
                      className="px-2 py-0.5 rounded bg-[#202b3d] hover:bg-[#2b3a52] text-gray-200 hover:text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>Instantané</span>
                    </button>
                    <button
                      onClick={() => setIsVideoPaused(!isVideoPaused)}
                      title={isVideoPaused ? "Reprendre la diffusion" : "Mettre en pause"}
                      className={`px-2 py-0.5 rounded transition ${
                        isVideoPaused
                          ? "bg-amber-900/60 text-amber-200"
                          : "bg-[#202b3d] text-gray-300 hover:text-white"
                      }`}
                    >
                      {isVideoPaused ? "En pause" : "Pause"}
                    </button>
                    <button
                      onClick={stopVisualDiffusion}
                      title="Arrêter la diffusion visuelle"
                      className="p-1 rounded hover:bg-red-950/60 text-red-400 hover:text-red-200 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Video Stream Element */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoElementRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />

                  {/* Watermark overlay */}
                  <div className="absolute top-2 left-2 pointer-events-none bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-emerald-300 font-mono flex items-center gap-1.5 border border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>DIFFUSION GEMINI VISION</span>
                  </div>

                  {isVideoPaused && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-amber-950/90 text-amber-300 border border-amber-700/60 rounded-lg font-bold text-xs">
                        Diffusion visuelle suspendue
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center md:items-start space-y-2 p-3 bg-[#131824]/60 border border-[#212b3c] rounded-xl max-w-sm">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Activer la diffusion visuelle</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Diffusez votre écran de code, le terminal ou votre webcam pour que Gemini voie
                  directement vos bugs ou interfaces.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => startVisualDiffusion("screen")}
                    className="px-3 py-1.5 rounded-lg bg-[#1f2838] hover:bg-[#29354b] text-gray-200 hover:text-white border border-[#2f3d54] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ScreenShare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Partager l'écran</span>
                  </button>
                  <button
                    onClick={() => startVisualDiffusion("camera")}
                    className="px-3 py-1.5 rounded-lg bg-[#1f2838] hover:bg-[#29354b] text-gray-200 hover:text-white border border-[#2f3d54] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-purple-400" />
                    <span>Activer webcam</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Voice Orb & Audio Controls */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-2.5 flex-1 min-w-[240px]">
            <div className="relative">
              {/* Pulsing rings when speaking */}
              {isSpeaking && (
                <div className="absolute -inset-2.5 rounded-full bg-purple-500/30 animate-ping pointer-events-none" />
              )}
              {isUserSpeaking && (
                <div className="absolute -inset-2.5 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
              )}

              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-2 transition-all duration-300 ${
                  isSpeaking
                    ? "bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-300 text-white scale-105"
                    : isUserSpeaking
                    ? "bg-gradient-to-tr from-emerald-600 to-teal-600 border-emerald-300 text-white scale-105"
                    : isConnected
                    ? "bg-[#182130] border-[#313f56] text-blue-400"
                    : "bg-[#141a24] border-[#252f40] text-gray-500"
                }`}
              >
                {isSpeaking ? (
                  <Volume2 className="w-7 h-7 animate-bounce" />
                ) : isMuted ? (
                  <MicOff className="w-7 h-7 text-red-400" />
                ) : (
                  <Mic className="w-7 h-7" />
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                }`}
              />
              <span className="font-medium text-xs text-gray-300">{statusText}</span>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/50 border border-red-800/60 px-3 py-1.5 rounded-lg max-w-xs text-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span className="truncate">{errorMessage}</span>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex items-center gap-2 pt-1">
              {!isConnected ? (
                <button
                  onClick={startVoiceSession}
                  disabled={isConnecting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isConnecting ? "Connexion..." : "Démarrer la session"}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Réactiver le micro" : "Couper le micro"}
                    className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                      isMuted
                        ? "bg-red-950/70 border-red-700 text-red-300 hover:bg-red-900"
                        : "bg-[#182130] border-[#2c394d] text-gray-200 hover:bg-[#202c40]"
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isMuted ? "Coupé" : "Muet"}</span>
                  </button>

                  <button
                    onClick={stopSession}
                    className="px-3.5 py-1.5 rounded-xl bg-[#261822] hover:bg-red-950/80 text-red-300 border border-red-800/60 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Square className="w-3.5 h-3.5 text-red-400" />
                    <span>Arrêter</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0c1017]">
          <div className="px-4 py-2 border-b border-[#1d2533] flex items-center justify-between text-[11px] text-gray-400 font-semibold tracking-wider uppercase">
            <span>Échanges en direct (Audio & Vision)</span>
            <div className="flex items-center gap-2">
              {isVisualActive && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono lowercase">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  diffusion active
                </span>
              )}
              {activeFile && (
                <span className="flex items-center gap-1 text-gray-500 font-mono text-[10px] lowercase">
                  <FileCode className="w-3 h-3 text-[#f26207]" />
                  {activeFile.name}
                </span>
              )}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcripts.map((t) => (
              <div
                key={t.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  t.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                    t.isVisionEvent
                      ? "bg-emerald-600 text-white"
                      : t.sender === "user"
                      ? "bg-[#f26207] text-white"
                      : "bg-purple-600 text-white"
                  }`}
                >
                  {t.isVisionEvent ? "👁️" : t.sender === "user" ? "U" : "AI"}
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    t.isVisionEvent
                      ? "bg-[#0f1d19] text-emerald-300 border border-emerald-800/40 font-mono text-[11px]"
                      : t.sender === "user"
                      ? "bg-[#1f2838] text-gray-100 rounded-tr-xs border border-[#2b374c]"
                      : "bg-[#141a25] text-gray-200 rounded-tl-xs border border-[#232b3a]"
                  }`}
                >
                  <div>{t.text}</div>
                  <div className="text-[10px] text-gray-500 mt-1 text-right">{t.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Optional Text fallback input while in voice/video session */}
          {isConnected && (
            <form
              onSubmit={handleSendTextMessage}
              className="p-2 bg-[#121620] border-t border-[#1d2533] flex items-center gap-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Posez une question sur ce que vous diffusez ou parlez..."
                className="flex-1 bg-[#18202d] text-xs text-gray-200 px-3 py-1.5 rounded-lg border border-[#293448] focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
