import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useHandControl } from '../context/HandControlContext';

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setHandState, cursorPositionRef, isHandDetectedRef } = useHandControl();
  const [loaded, setLoaded] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

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
        // Silent failure
      }
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { width: 640, height: 480, facingMode: "user" } 
          });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        } catch (e) {
          // Silent failure
        }
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
        
        // Update Refs directly (no re-render)
        isHandDetectedRef.current = true;
        cursorPositionRef.current = { x, y };

        // Update State (triggers re-render only if changed)
        setHandState(isUnleashed);
        
        // Update DOM indicator directly
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
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} 
      />
      <div 
        ref={indicatorRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '12px',
          height: '12px',
          backgroundColor: '#00ff00',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 10px #00ff00',
          zIndex: 50,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.2s'
        }}
      />
      {!loaded && (
        <div className="absolute top-4 right-4 text-green-500 text-xs">
          Loading Hand Tracking...
        </div>
      )}
    </>
  );
};

export default HandTracker;