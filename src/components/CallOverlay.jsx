import React, { useState, useEffect, useRef } from 'react';
import './CallOverlay.css';
import { Avatar } from '@mui/material';
import { CallEnd, Mic, MicOff, Videocam, VideocamOff, VolumeUp } from '@mui/icons-material';

function CallOverlay({ activeCall, onClose }) {
    const { name, photo, type } = activeCall; // type: 'audio' or 'video'
    const [callStatus, setCallStatus] = useState('calling'); // calling, ringing, connected
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(type === 'video');

    const localVideoRef = useRef(null);
    const timerRef = useRef(null);

    // Simulate Call Lifecycle
    useEffect(() => {
        // 1. Calling... (simulated delay)
        const ringTimer = setTimeout(() => {
            setCallStatus('ringing');
            // 2. Connected... (simulate pickup after 2s)
            setTimeout(() => {
                setCallStatus('connected');
                // Start Timer
                timerRef.current = setInterval(() => {
                    setDuration(prev => prev + 1);
                }, 1000);
            }, 2500);
        }, 1500);

        return () => {
            clearTimeout(ringTimer);
            clearInterval(timerRef.current);
        };
    }, []);

    // Camera Logic
    useEffect(() => {
        if (isVideoEnabled && callStatus !== 'ended') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isVideoEnabled]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); // Audio false to prevent feedback in dev
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access failed", err);
        }
    };

    const stopCamera = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            localVideoRef.current.srcObject = null;
        }
    };

    const formatDuration = (secs) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="call-overlay">
            {/* Background Video (Selfie) if enabled */}
            {isVideoEnabled && (
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    className="video-stream"
                />
            )}

            <div className="call-header">
                <div className="call-avatar-container">
                    {!isVideoEnabled && (
                        <>
                            <div className="pulse-ring"></div>
                            <div className="pulse-ring"></div>
                        </>
                    )}
                    <Avatar src={photo} className="call-avatar" />
                </div>
                <h2>{name}</h2>
                <p>
                    {callStatus === 'calling' && 'Calling...'}
                    {callStatus === 'ringing' && 'Ringing...'}
                    {callStatus === 'connected' && formatDuration(duration)}
                </p>
            </div>

            <div className="call-controls">
                <button className={`control-btn ${isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <MicOff /> : <Mic />}
                </button>
                <button className={`control-btn ${!isVideoEnabled ? 'active' : ''}`} onClick={() => setIsVideoEnabled(!isVideoEnabled)}>
                    {isVideoEnabled ? <Videocam /> : <VideocamOff />}
                </button>
                <button className="control-btn end-call" onClick={onClose}>
                    <CallEnd />
                </button>
            </div>
        </div>
    );
}

export default CallOverlay;
