import React, { useState } from 'react';
import { Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import './Sidebar.css';
import './SidebarChat.css';
import { db } from '../firebase';
import { collection, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

function SidebarChat({ chat, user, selectedChat, onSelectChat }) {
    const getRecipientEmail = (users, chat) => {
        if (chat?.type === 'group') {
            return chat.groupName;
        }
        return users?.filter(u => u !== user?.email)[0];
    }

    const recipientEmail = getRecipientEmail(chat.users, chat);

    // Only query if it's a 1-on-1 chat
    const [recipientSnapshot] = useCollection(
        chat.type !== 'group' && recipientEmail ?
            query(collection(db, "users"), where("email", "==", recipientEmail)) : null
    );

    const recipient = recipientSnapshot?.docs?.[0]?.data();
    const displayName = chat.type === 'group' ? chat.groupName : (recipient?.displayName || recipientEmail);
    const photoURL = chat.type === 'group' ? null : recipient?.photoURL;

    // Typing logic
    const isTyping = chat.typing && chat.typing.includes(recipientEmail);

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        if (event) event.stopPropagation();
        setAnchorEl(null);
    };

    const handleDeleteChat = async (event) => {
        event.stopPropagation(); // Prevent opening the chat
        const confirmDelete = window.confirm("Are you sure you want to delete this chat?");
        if (confirmDelete) {
            try {
                // In a real app, we might just hide it for the user or delete subcollection first
                await deleteDoc(doc(db, "chats", chat.id));
            } catch (err) {
                console.error("Error deleting chat:", err);
            }
        }
        handleClose();
    };

    return (
        <div
            className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
            onClick={() => onSelectChat(chat)}
        >
            <Avatar src={photoURL}>
                {displayName?.[0]}
            </Avatar>
            <div className="chat-info">
                <div className="chat-title">
                    <h3>{displayName}</h3>
                    <span className="chat-time">
                        {chat.timestamp ? new Date(chat.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>
                <div className="chat-preview">
                    {isTyping ? (
                        <p style={{ color: '#00a884', fontWeight: '500' }}>Typing...</p>
                    ) : (
                        <p>{chat.lastMessage}</p>
                    )}
                </div>
            </div>

            <div className="chat-options-btn">
                <IconButton size="small" onClick={handleMenuClick}>
                    <KeyboardArrowDownIcon fontSize="small" />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MenuItem onClick={handleDeleteChat}>Delete chat</MenuItem>
                </Menu>
            </div>
        </div>
    );
}

export default SidebarChat;
