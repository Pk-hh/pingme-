import React, { useState } from 'react';
import './ChatInfoDrawer.css';
import { Close, Block, ExitToApp, ThumbDown, PersonAdd, Delete } from '@mui/icons-material';
import { Avatar, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

function ChatInfoDrawer({ open, onClose, chat, recipientEmail, user }) {

    // Determine info based on chat type
    const isGroup = chat.type === "group";
    const name = isGroup ? chat.groupName : (chat.recipientName || recipientEmail); // Fallback logic
    const photo = isGroup ? "" : chat.recipientPhoto; // In real app, group might have photo
    const phone = isGroup ? `${chat.users?.length} participants` : recipientEmail; // Using email as phone placeholder

    const [newParticipant, setNewParticipant] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAddParticipant = async () => {
        if (!newParticipant) return;
        try {
            const chatRef = doc(db, "chats", chat.id);
            await updateDoc(chatRef, {
                users: arrayUnion(newParticipant)
            });
            alert(`Added ${newParticipant}`);
            setNewParticipant("");
            setIsDialogOpen(false);
        } catch (err) {
            console.error("Error adding participant:", err);
            alert("Failed to add participant");
        }
    };

    const handleExitGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        try {
            const chatRef = doc(db, "chats", chat.id);
            // Remove current user from users array
            await updateDoc(chatRef, {
                users: arrayRemove(user?.email)
            });
            onClose(); // Close drawer
            // Ideally should also redirect out of chat, but this updates the doc which Chat.jsx listens to?
            // Chat.jsx might get "permission denied" or empty list if user is removed and query changes?
            // Actually, sidebar works on 'users array-contains myEmail'. So sidebar will remove it.
            // Active chat: User will likely see "You are no longer a participant" or just errors if security rules block.
            // For now, this is sufficient.
        } catch (err) {
            console.error("Error exiting group:", err);
            alert("Failed to exit group");
        }
    };

    return (
        <div className={`chat-info-drawer ${open ? 'open' : ''}`}>
            <div className="chat-info-header">
                <Close onClick={onClose} />
                <span>{isGroup ? "Group Info" : "Contact Info"}</span>
            </div>

            <div className="chat-info-body">
                {/* Profile Card */}
                <div className="chat-info-card">
                    <Avatar
                        src={photo}
                        className="chat-info-avatar"
                    />
                    <div className="chat-info-name">{name}</div>
                    <div className="chat-info-phone">{phone}</div>
                </div>

                {/* Group Participants Section */}
                {isGroup && (
                    <div className="chat-info-section">
                        <div className="section-title">{chat.users?.length} Participants</div>
                        <div className="participants-list">
                            {chat.users?.map((u, i) => (
                                <div key={i} className="participant-item">
                                    <Avatar style={{ width: 30, height: 30, marginRight: 10 }} />
                                    <span>{u}</span>
                                </div>
                            ))}
                        </div>
                        <div className="action-item" onClick={() => setIsDialogOpen(true)} style={{ marginTop: '10px' }}>
                            <PersonAdd />
                            <span>Add Participant</span>
                        </div>
                    </div>
                )}

                {/* About Section (Only for users) */}
                {!isGroup && (
                    <div className="chat-info-section">
                        <div className="section-title">About</div>
                        <div className="section-content">Available</div>
                    </div>
                )}

                {/* Media Links Docs (Placeholder) */}
                <div className="chat-info-section">
                    <div className="section-content">Media, links, and docs</div>
                    <div style={{ color: '#667781', fontSize: '12px', marginTop: '5px' }}>0 items</div>
                </div>

                {/* Actions */}
                <div className="chat-info-section" style={{ padding: 0, backgroundColor: 'transparent', boxShadow: 'none' }}>
                    {isGroup ? (
                        <div className="action-item" onClick={handleExitGroup} style={{ color: '#ea0038' }}>
                            <ExitToApp style={{ color: '#ea0038' }} />
                            <span>Exit group</span>
                        </div>
                    ) : (
                        <>
                            <div className="action-item">
                                <Block />
                                <span>Block {name}</span>
                            </div>
                            <div className="action-item">
                                <ThumbDown />
                                <span>Report {name}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add Participant Dialog */}
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                <DialogTitle>Add Participant</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="standard"
                        value={newParticipant}
                        onChange={(e) => setNewParticipant(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddParticipant}>Add</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default ChatInfoDrawer;
