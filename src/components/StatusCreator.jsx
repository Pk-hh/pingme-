import React, { useState, useRef } from 'react';
import './StatusCreator.css';
import { IconButton } from '@mui/material';
import { Close, Send, Image, TextFields, ColorLens } from '@mui/icons-material';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function StatusCreator({ user, onClose }) {
    const [type, setType] = useState('text'); // 'text' or 'image'
    const [content, setContent] = useState("");
    const [color, setColor] = useState('#008069');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const colors = ['#008069', '#d62976', '#a82c2c', '#5e2ca8', '#2c5ea8', '#a8a82c'];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setContent(e.target.result);
            setType('image');
        };
        reader.readAsDataURL(file);
    };

    const postStatus = async () => {
        if (!content) return;
        setLoading(true);

        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            await addDoc(collection(db, 'status'), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email,
                photoURL: user.photoURL,
                content: content,
                type: type,
                color: type === 'text' ? color : null,
                timestamp: serverTimestamp(),
                expiresAt: expiresAt,
                viewers: []
            });
            onClose();
        } catch (error) {
            console.error("Error posting status:", error);
            alert("Failed to post status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="status-creator" style={{ backgroundColor: type === 'text' ? color : '#111' }}>
            <div className="creator-header">
                <IconButton onClick={onClose} style={{ color: 'white' }}>
                    <Close />
                </IconButton>
                <div className="creator-actions">
                    {type === 'text' && (
                        <IconButton onClick={() => setColor(colors[Math.floor(Math.random() * colors.length)])}>
                            <ColorLens style={{ color: 'white' }} />
                        </IconButton>
                    )}
                    <IconButton onClick={() => fileInputRef.current.click()}>
                        <Image style={{ color: 'white' }} />
                    </IconButton>
                    <IconButton onClick={() => { setType('text'); setContent(''); }}>
                        <TextFields style={{ color: 'white' }} />
                    </IconButton>
                </div>
            </div>

            <div className="creator-body">
                {type === 'text' ? (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type a status..."
                        className="status-input"
                        autoFocus
                    />
                ) : (
                    <img src={content} alt="Preview" className="status-preview" />
                )}
            </div>

            <div className="creator-footer">
                <div className="send-btn" onClick={postStatus}>
                    {loading ? "..." : <Send />}
                </div>
            </div>

            <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
}

export default StatusCreator;
