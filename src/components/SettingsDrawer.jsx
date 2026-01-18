import React, { useState } from 'react';
import './SettingsDrawer.css';
import { ArrowBack, Key, Notifications, DataUsage, Help, Wallpaper, Logout } from '@mui/icons-material';
import { Avatar } from '@mui/material';

function SettingsDrawer({ open, onClose, user, onLogout, setWallpaper, currentWallpaper }) {
    const [view, setView] = useState('main'); // 'main' or 'wallpaper'

    // Preset Colors
    const wallpapers = [
        { color: '#efe7dd', name: 'Default', doodle: true }, // Default PingMe
        { color: '#dcf8c6', name: 'Mint' },
        { color: '#ece5dd', name: 'Beige' },
        { color: '#fff5c4', name: 'Yellow' },
        { color: '#ffe4e1', name: 'Rose' },
        { color: '#e1f5fe', name: 'Sky' },
        { color: '#e8eaf6', name: 'Indigo' },
        { color: '#f3e5f5', name: 'Lavender' },
        { color: '#2c3e50', name: 'Dark Blue' },
        { color: '#000000', name: 'Black' },
    ];

    const handleBack = () => {
        if (view === 'wallpaper') {
            setView('main');
        } else {
            onClose();
        }
    };

    return (
        <div className={`settings-drawer ${open ? 'open' : ''}`}>
            <div className="settings-header">
                <div className="settings-header-content">
                    <ArrowBack onClick={handleBack} />
                    <span>{view === 'wallpaper' ? 'Chat Wallpaper' : 'Settings'}</span>
                </div>
            </div>

            <div className="settings-body">
                {view === 'main' ? (
                    <>
                        {/* Profile Section */}
                        <div className="settings-profile-card">
                            <Avatar src={user?.photoURL} className="settings-avatar" />
                            <div className="settings-user-info">
                                <h3>{user?.displayName}</h3>
                                <p>Available</p>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="settings-item">
                            <Notifications />
                            <div className="settings-item-text">
                                <h4>Notifications</h4>
                                <p>Message, group & call tones</p>
                            </div>
                        </div>

                        <div className="settings-item">
                            <Key />
                            <div className="settings-item-text">
                                <h4>Privacy</h4>
                                <p>Block contacts, disappearing messages</p>
                            </div>
                        </div>

                        <div className="settings-item" onClick={() => setView('wallpaper')}>
                            <Wallpaper />
                            <div className="settings-item-text">
                                <h4>Chat Wallpaper</h4>
                                <p>Change chat background</p>
                            </div>
                        </div>

                        <div className="settings-item">
                            <Help />
                            <div className="settings-item-text">
                                <h4>Help</h4>
                                <p>Help center, contact us, privacy policy</p>
                            </div>
                        </div>

                        <div className="settings-item" onClick={onLogout} style={{ marginTop: '20px', color: '#ea0038' }}>
                            <Logout style={{ color: '#ea0038' }} />
                            <div className="settings-item-text">
                                <h4 style={{ color: '#ea0038' }}>Log out</h4>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="wallpaper-section">
                        <p style={{ fontSize: '14px', color: 'gray', marginBottom: '15px' }}>Choose a background color for your chats:</p>
                        <div className="color-grid">
                            {wallpapers.map((wp, index) => (
                                <div
                                    key={index}
                                    className={`color-swatch ${wp.color === currentWallpaper ? 'selected' : ''} ${wp.doodle ? 'default-doodle' : ''}`}
                                    style={{ backgroundColor: wp.color }}
                                    onClick={() => setWallpaper(wp.doodle ? 'default' : wp.color)}
                                    title={wp.name}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SettingsDrawer;
