import React, { useState } from 'react';
import './Sidebar.css';
import { Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Menu, MenuItem } from '@mui/material';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ChatIcon from '@mui/icons-material/Chat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import ProfileDrawer from './ProfileDrawer';
import StatusCreator from './StatusCreator';
import StatusView from './StatusView';
import StarredMessagesDrawer from './StarredMessagesDrawer';
import SidebarChat from './SidebarChat';
import SettingsDrawer from './SettingsDrawer';
import { CameraAlt, Edit } from '@mui/icons-material';

function Sidebar({ user, selectedChat, onSelectChat, setWallpaper, currentWallpaper }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [anchorEl, setAnchorEl] = useState(null); // State for menu anchor
    const open = Boolean(anchorEl); // Boolean for menu open state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isStarredOpen, setIsStarredOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'status'

    // Status State
    const [isCreatingStatus, setIsCreatingStatus] = useState(false);
    const [viewingStatus, setViewingStatus] = useState(null); // Status object or null

    // Fetch Statuses (Simple fetch all for now, optimized later)
    // In real app, match by contact list
    const [statusSnapshot] = useCollection(
        query(collection(db, "status"), where("expiresAt", ">", new Date()))
    );

    const statuses = statusSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];
    const myStatus = statuses.filter(s => s.email === user.email);
    const otherStatuses = statuses.filter(s => s.email !== user.email);

    // Group other statuses by user
    const groupedStatuses = otherStatuses.reduce((acc, curr) => {
        (acc[curr.email] = acc[curr.email] || []).push(curr);
        return acc;
    }, {});

    // Fetch chats where current user is a participant
    const userChatsQuery = query(
        collection(db, "chats"),
        where("users", "array-contains", user.email)
    );
    const [chatsSnapshot] = useCollection(userChatsQuery);

    const [groupName, setGroupName] = useState("");
    const [isGroup, setIsGroup] = useState(false);

    // Handlers for the MoreVert menu
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        auth.signOut();
        handleClose();
    };

    const toggleTheme = () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        handleClose();
    };

    // Load theme on mount
    React.useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        }
    }, []);

    const handleCreateChat = async () => {
        if (isGroup) {
            if (!groupName || !recipientEmail) {
                alert("Please enter a group name and add at least one member.");
                return;
            }

            const emails = recipientEmail.split(',').map(e => e.trim()).filter(e => e !== "");
            if (emails.length === 0) return;

            await addDoc(collection(db, "chats"), {
                users: [user.email, ...emails],
                groupName: groupName,
                type: 'group',
                admin: user.email,
                lastMessage: "Group created",
                timestamp: serverTimestamp()
            });
        } else {
            if (!recipientEmail) return;

            if (recipientEmail === user.email) {
                alert("You cannot chat with yourself!");
                return;
            }

            // Check if chat already exists
            const chatExists = chatsSnapshot?.docs.find(chat =>
                !chat.data().type && chat.data().users.find(u => u === recipientEmail)?.length > 0
            );

            if (chatExists) {
                onSelectChat({ id: chatExists.id, ...chatExists.data() });
                setIsDialogOpen(false);
                setRecipientEmail("");
                return;
            } else {
                await addDoc(collection(db, "chats"), {
                    users: [user.email, recipientEmail],
                    lastMessage: "",
                    timestamp: serverTimestamp()
                });
            }
        }

        setIsDialogOpen(false);
        setRecipientEmail("");
        setGroupName("");
        setIsGroup(false);
    };

    const getRecipientEmail = (users, chat) => {
        if (chat?.type === 'group') {
            return chat.groupName;
        }
        return users?.filter(u => u !== user?.email)[0];
    }

    const chats = chatsSnapshot?.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) || [];

    const filteredChats = chats.filter(chat => {
        const title = chat.type === 'group' ? chat.groupName : getRecipientEmail(chat.users, chat);
        return title?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="avatar-container">
                    <Avatar
                        src={user?.photoURL}
                        onClick={() => setIsProfileOpen(true)}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
                {/* Tabs */}
                <div className="sidebar-tabs">
                    <div
                        className={`sidebar-tab ${activeTab === 'chats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chats')}
                    >
                        <ChatIcon fontSize="small" />
                    </div>
                    <div
                        className={`sidebar-tab ${activeTab === 'status' ? 'active' : ''}`}
                        onClick={() => setActiveTab('status')}
                    >
                        <DonutLargeIcon fontSize="small" />
                        {otherStatuses.length > 0 && <span className="tab-indicator"></span>}
                    </div>
                </div>
                <div className="header-actions">
                    <IconButton onClick={() => setIsDialogOpen(true)}>
                        <ChatIcon />
                    </IconButton>
                    <IconButton onClick={handleClick}>
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={() => { setIsStarredOpen(true); handleClose(); }}>Starred Messages</MenuItem>
                        <MenuItem onClick={() => { setIsSettingsOpen(true); handleClose(); }}>Settings</MenuItem>
                    </Menu>
                </div>
            </div>

            <SettingsDrawer
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                user={user}
                onLogout={handleLogout}
                setWallpaper={setWallpaper}
                currentWallpaper={currentWallpaper}
            />

            <ProfileDrawer
                open={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
            />

            <StarredMessagesDrawer
                open={isStarredOpen}
                onClose={() => setIsStarredOpen(false)}
                user={user}
            />

            <div className="search-container">
                <div className="search-bar">
                    <SearchOutlined />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Body Based on Tab */}
            {
                activeTab === 'chats' ? (
                    <div className="chats-list">
                        {filteredChats.map((chat) => (
                            <SidebarChat
                                key={chat.id}
                                chat={chat}
                                user={user}
                                selectedChat={selectedChat}
                                onSelectChat={onSelectChat}
                            />
                        ))}
                        {filteredChats.length === 0 && (
                            <div className="no-contacts">
                                <p>No chats found. Click + to start one.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="status-list">
                        {/* My Status */}
                        <div className="status-item" onClick={() => setIsCreatingStatus(true)}>
                            <div className="status-avatar-container">
                                <Avatar src={user.photoURL} />
                                <div className="status-add-icon"><CameraAlt style={{ fontSize: '14px' }} /></div>
                            </div>
                            <div className="status-info">
                                <h3>My Status</h3>
                                <p>Click to add status update</p>
                            </div>
                        </div>

                        {myStatus.length > 0 && (
                            <div className="status-section-title">My Updates</div>
                        )}
                        {myStatus.map(status => (
                            <div key={status.id} className="status-item" onClick={() => setViewingStatus(status)}>
                                <Avatar src={status.content} style={{ border: '2px solid #00a884' }} />
                                <div className="status-info">
                                    <h3>Me</h3>
                                    <p>
                                        {new Date(status.timestamp?.toDate()).toLocaleTimeString()}
                                        {status.viewers?.length > 0 && (
                                            <span style={{ marginLeft: '10px', fontSize: '11px', color: '#666' }}>
                                                👁 {status.viewers.length}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <div className="status-section-title">Recent Updates</div>
                        {Object.keys(groupedStatuses).length === 0 && <p className="no-status-text">No recent updates</p>}

                        {Object.entries(groupedStatuses).map(([email, userStatuses]) => {
                            const latestStatus = userStatuses[userStatuses.length - 1]; // Simply take last for preview
                            return (
                                <div key={email} className="status-item" onClick={() => setViewingStatus(latestStatus)}>
                                    <div className="status-ring">
                                        <Avatar src={latestStatus.photoURL} />
                                    </div>
                                    <div className="status-info">
                                        <h3>{latestStatus.displayName || email}</h3>
                                        <p>{new Date(latestStatus.timestamp?.toDate()).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {/* Status Modals */}
            {isCreatingStatus && <StatusCreator user={user} onClose={() => setIsCreatingStatus(false)} />}
            {
                viewingStatus && (
                    <StatusView
                        status={viewingStatus}
                        user={user} // Pass current user for viewer tracking
                        onClose={() => setViewingStatus(null)}
                        onNext={() => {
                            const playbackList = [
                                ...myStatus.sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis()),
                                ...Object.values(groupedStatuses).flat().sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis())
                            ];
                            const currentIndex = playbackList.findIndex(s => s.id === viewingStatus.id);
                            if (currentIndex < playbackList.length - 1) {
                                setViewingStatus(playbackList[currentIndex + 1]);
                            } else {
                                setViewingStatus(null);
                            }
                        }}
                        onPrev={() => {
                            const playbackList = [
                                ...myStatus.sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis()),
                                ...Object.values(groupedStatuses).flat().sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis())
                            ];
                            const currentIndex = playbackList.findIndex(s => s.id === viewingStatus.id);
                            if (currentIndex > 0) {
                                setViewingStatus(playbackList[currentIndex - 1]);
                            } else {
                                setViewingStatus(null);
                            }
                        }}
                    />
                )
            }

            {/* New Chat Dialog */}
            <Dialog open={isDialogOpen} onClose={() => { setIsDialogOpen(false); setRecipientEmail(""); setIsGroup(false); }}>
                <DialogTitle>{isGroup ? "Create New Group" : "Create New Chat"}</DialogTitle>
                <DialogContent>
                    <div style={{ marginBottom: '15px' }}>
                        <Button
                            onClick={() => setIsGroup(false)}
                            variant={!isGroup ? "contained" : "outlined"}
                            style={{ marginRight: '10px' }}
                        >
                            Direct
                        </Button>
                        <Button
                            onClick={() => setIsGroup(true)}
                            variant={isGroup ? "contained" : "outlined"}
                        >
                            Group
                        </Button>
                    </div>

                    {isGroup && (
                        <TextField
                            margin="dense"
                            label="Group Name"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    )}

                    <TextField
                        autoFocus={!isGroup}
                        margin="dense"
                        id="name"
                        label={isGroup ? "Participant Emails (comma separated)" : "Email Address"}
                        type="email"
                        fullWidth
                        variant="standard"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateChat();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setIsDialogOpen(false); setRecipientEmail(""); setIsGroup(false); }}>Cancel</Button>
                    <Button onClick={handleCreateChat}>
                        {isGroup ? "Create Group" : "Start Chat"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div >
    );
}

export default Sidebar;
