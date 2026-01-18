import React, { useState, useEffect } from 'react';
import './StarredMessagesDrawer.css'; // Will create this css next
import { ArrowBack, Star } from '@mui/icons-material';
import { db } from '../firebase';
import { collectionGroup, query, where, orderBy, getDocs } from 'firebase/firestore';

function StarredMessagesDrawer({ open, onClose, user }) {
    const [starredMessages, setStarredMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && user) {
            fetchStarredMessages();
        }
    }, [open, user]);

    const fetchStarredMessages = async () => {
        setLoading(true);
        try {
            // Note: asking for index on 'starredBy' + 'timestamp' might be needed
            const q = query(
                collectionGroup(db, 'messages'),
                where('starredBy', 'array-contains', user.email)
            );

            const querySnapshot = await getDocs(q);
            const msgs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                chatId: doc.ref.parent.parent.id // robust way to get chat ID
            }));

            // Sort client side since we might lack composite index for now
            msgs.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

            setStarredMessages(msgs);
        } catch (error) {
            console.error("Error fetching starred messages:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`starred-drawer ${open ? 'open' : ''}`}>
            <div className="starred-header">
                <ArrowBack onClick={onClose} style={{ cursor: 'pointer' }} />
                <div style={{ marginLeft: '15px' }}>Starred Messages</div>
            </div>

            <div className="starred-body">
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
                ) : (
                    starredMessages.length > 0 ? (
                        starredMessages.map(msg => (
                            <div key={msg.id} className="starred-item">
                                <div className="starred-meta">
                                    <span style={{ fontWeight: 'bold', color: '#008069' }}>{msg.sender}</span>
                                    <span style={{ fontSize: '11px', color: 'gray' }}>
                                        {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleDateString() : ''}
                                    </span>
                                </div>
                                <div className="starred-content">
                                    {msg.image ? (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <img src={msg.image} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px', marginRight: '10px' }} />
                                            <span>Photo</span>
                                        </div>
                                    ) : msg.audio ? (
                                        <span>🎤 Audio</span>
                                    ) : (
                                        <p>{msg.text}</p>
                                    )}
                                    <Star style={{ fontSize: '14px', color: '#ffd700', marginLeft: 'auto' }} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-starred">
                            <Star style={{ fontSize: '50px', color: '#f0f2f5', marginBottom: '20px' }} />
                            <p>No starred messages yet.</p>
                            <span style={{ fontSize: '13px', color: 'gray', textAlign: 'center', display: 'block', padding: '0 20px' }}>
                                Tap and hold on any message to star it, so you can easily find it later.
                            </span>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default StarredMessagesDrawer;
