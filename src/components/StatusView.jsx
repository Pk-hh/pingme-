import React, { useState, useEffect } from 'react';
import './StatusView.css';
import { IconButton } from '@mui/material';
import { Close, ArrowBack, ArrowForward } from '@mui/icons-material';

function StatusView({ status, user, onClose, onNext, onPrev }) {
    const [progress, setProgress] = useState(0);
    const duration = 5000; // 5 seconds per status

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / duration) * 100;

            if (newProgress >= 100) {
                clearInterval(interval);
                onNext(); // Auto advance
            } else {
                setProgress(newProgress);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [status, onNext]);

    // View Tracking
    useEffect(() => {
        if (!status?.id || !user?.email) return;

        // Check if I already viewed it
        const alreadyViewed = status.viewers?.some(v => v === user.email);

        if (!alreadyViewed && status.uid !== user.uid) {
            import('../firebase').then(({ db }) => {
                import('firebase/firestore').then(({ doc, updateDoc, arrayUnion }) => {
                    const statusRef = doc(db, "status", status.id);
                    updateDoc(statusRef, {
                        viewers: arrayUnion(user.email)
                    }).catch(err => console.error("Error updating view count:", err));
                });
            });
        }
    }, [status.id, user.email, status.uid, status.viewers]);

    return (
        <div className="status-view-overlay">
            <div className="status-progress-container">
                <div className="status-progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="status-header">
                <IconButton onClick={onClose} style={{ color: 'white' }}>
                    <ArrowBack />
                </IconButton>
                <div className="status-user-info">
                    <img src={status.photoURL} alt="" className="status-avatar" />
                    <span>{status.displayName}</span>
                    <span className="status-time">
                        {new Date(status.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="status-content">
                {status.type === 'image' ? (
                    <img src={status.content} alt="Status" />
                ) : (
                    <div className="status-text" style={{ backgroundColor: status.color || '#000' }}>
                        {status.content}
                    </div>
                )}
            </div>

            {/* Navigation Click Areas */}
            <div className="status-nav-left" onClick={onPrev}></div>
            <div className="status-nav-right" onClick={() => { setProgress(100); onNext(); }}></div>
        </div>
    );
}

export default StatusView;
