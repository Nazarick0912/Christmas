import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useHandControl } from '../context/HandControlContext';

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setHandState, cursorPositionRef, isHandDetectedRef, cameraEnabled, setCameraEnabled } = useHandControl();
  const [loaded, setLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cameraEnabled) {
      isHandDetectedRef.current = false;
      setHandState(false);
      if (indicatorRef.current) indicatorRef.current.style.opacity = '0';
      return;
    }

    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let streamRef: MediaStream | null = null;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setLoaded(true);
        startWebcam();
      } catch (error) {
        setCameraError("Camera unavailable. Using keyboard & mouse fallback.");
        setLoaded(true);
      }
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { width: 640, height: 480, facingMode: "user" } 
          });
          streamRef = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', predictWebcam);
          }
        } catch (e: any) {
          setCameraError("Camera access denied. Keyboard & mouse fallback active.");
        }
      } else {
        setCameraError("Camera not supported. Keyboard & mouse fallback active.");
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current) return;
      
      const startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // 1. Pointing Gesture: Index Finger Tip (8)
        const indexTip = landmarks[8];
        const x = 1.0 - indexTip.x; // Mirror X
        const y = indexTip.y;

        // 2. Open vs Fist: Distance between Thumb Tip (4) and Pinky Tip (20)
        const thumbTip = landmarks[4];
        const pinkyTip = landmarks[20];
        
        const dx = thumbTip.x - pinkyTip.x;
        const dy = thumbTip.y - pinkyTip.y;
        const dz = thumbTip.z - pinkyTip.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

        const isUnleashed = distance > 0.15;
        
        isHandDetectedRef.current = true;
        cursorPositionRef.current = { x, y };
        setHandState(isUnleashed);
        
        if (indicatorRef.current) {
            indicatorRef.current.style.opacity = '1';
            indicatorRef.current.style.left = `${x * 100}%`;
            indicatorRef.current.style.top = `${y * 100}%`;
        }

      } else {
        isHandDetectedRef.current = false;
        setHandState(false);
        if (indicatorRef.current) {
            indicatorRef.current.style.opacity = '0';
        }
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
      if (streamRef) {
         streamRef.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraEnabled]);

  return (
    <>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} 
      />
      {/* Hand cursor indicator */}
      <div 
        ref={indicatorRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '12px',
          height: '12px',
          backgroundColor: '#FF69B4',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 12px #FF69B4',
          zIndex: 50,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.2s'
        }}
      />

      {/* Control Mode Badge & Toggle */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-2 font-mono text-xs">
        {cameraEnabled && !cameraError ? (
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-pink-500/30 rounded-full px-3 py-1.5 text-pink-200 shadow-[0_0_10px_rgba(255,105,180,0.2)]">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>{loaded ? "📷 Hand Tracking Active" : "Initializing Camera..."}</span>
            <button 
              onClick={() => setCameraEnabled(false)}
              className="text-pink-400 hover:text-pink-100 underline ml-1 cursor-pointer"
              title="Switch to Keyboard Mode"
            >
              Switch to Keys
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-amber-500/40 rounded-full px-3 py-1.5 text-amber-200 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
            <span>⌨️ Keyboard Mode (Spacebar to Expand)</span>
            <button 
              onClick={() => {
                setCameraError(null);
                setCameraEnabled(true);
              }}
              className="text-amber-300 hover:text-white underline ml-1 cursor-pointer"
              title="Try Enabling Webcam"
            >
              Use Camera
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default HandTracker;