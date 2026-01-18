import React, { useState, useRef } from 'react';
import './ProfileDrawer.css';
import { ArrowBack, Edit, Check, CameraAlt } from '@mui/icons-material'; // Import Check and CameraAlt icons
import { Avatar, IconButton, CircularProgress } from '@mui/material'; // Import CircularProgress
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

function ProfileDrawer({ open, onClose, user }) {
    const [name, setName] = useState(user?.displayName || "");
    const [about, setAbout] = useState(user?.about || "Available"); // Default about
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingAbout, setIsEditingAbout] = useState(false);
    const [loading, setLoading] = useState(false); // For image upload
    const fileInputRef = useRef(null);

    const handleUpdateName = async () => {
        if (name.trim() === "") return;
        setIsEditingName(false);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                displayName: name
            });
            // Also update auth profile if possible, but Firestore is main source for app
        } catch (err) {
            console.error("Error updating name:", err);
        }
    };

    const handleUpdateAbout = async () => {
        if (about.trim() === "") return;
        setIsEditingAbout(false);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                about: about
            });
        } catch (err) {
            console.error("Error updating about:", err);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) { // 1MB limit
            alert("File too large. Please choose image under 1MB.");
            return;
        }

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            const base64Image = readerEvent.target.result;
            try {
                await updateDoc(doc(db, "users", user.uid), {
                    photoURL: base64Image
                });
                // We rely on parent passing updated 'user' object or listener
            } catch (err) {
                console.error("Error updating photo:", err);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className={`profile-drawer ${open ? 'open' : ''}`}>
            <div className="profile-drawer-header">
                <ArrowBack onClick={onClose} />
                <span style={{ marginLeft: '20px' }}>Profile</span>
            </div>

            <div className="profile-drawer-body">
                <div className="profile-picture-section">
                    <div style={{ position: 'relative' }}>
                        <Avatar
                            src={user?.photoURL}
                            onClick={handleImageClick}
                        />
                        {loading && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', zIndex: 2 }}>
                                <CircularProgress style={{ color: 'white' }} />
                            </div>
                        )}
                        <div className="avatar-overlay">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
                                <CameraAlt />
                                <span style={{ fontSize: '12px', marginTop: '5px' }}>CHANGE</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>

                <div className="profile-section">
                    <label>Your Name</label>
                    <div className="profile-section-content">
                        {isEditingName ? (
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                <input
                                    className="profile-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                                <IconButton onClick={handleUpdateName}>
                                    <Check style={{ color: '#008080' }} />
                                </IconButton>
                            </div>
                        ) : (
                            <>
                                <span>{user?.displayName || "No Name"}</span>
                                <IconButton onClick={() => setIsEditingName(true)}>
                                    <Edit style={{ color: 'gray', fontSize: '20px' }} />
                                </IconButton>
                            </>
                        )}
                    </div>
                </div>
                <div className="profile-info-text">
                    This is not your username or pin. This name will be visible to your PingMe contacts.
                </div>

                <div className="profile-section" style={{ marginTop: '20px' }}>
                    <label>About</label>
                    <div className="profile-section-content">
                        {isEditingAbout ? (
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                <input
                                    className="profile-input"
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    autoFocus
                                />
                                <IconButton onClick={handleUpdateAbout}>
                                    <Check style={{ color: '#008080' }} />
                                </IconButton>
                            </div>
                        ) : (
                            <>
                                <span>{user?.about || "Available"}</span>
                                <IconButton onClick={() => setIsEditingAbout(true)}>
                                    <Edit style={{ color: 'gray', fontSize: '20px' }} />
                                </IconButton>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfileDrawer;
