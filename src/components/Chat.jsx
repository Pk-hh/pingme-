import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import { AttachFile, MoreVert, SearchOutlined, InsertEmoticon, Mic, ArrowBack, DoneAll, Check, Delete, Close, Stop, Send, Star, Reply, Call, Videocam } from '@mui/icons-material';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, setDoc, where, deleteDoc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import EmojiPicker from 'emoji-picker-react';
import ChatInfoDrawer from './ChatInfoDrawer';
import MediaLightbox from './MediaLightbox';
import CallOverlay from './CallOverlay';

function Chat({ chat, user, onBack, wallpaper }) {
    const [input, setInput] = useState("");
    const [activeCall, setActiveCall] = useState(null); // { name, photo, type }
    const [showPicker, setShowPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showChatInfo, setShowChatInfo] = useState(false); // State for Info Drawer
    const [viewingImage, setViewingImage] = useState(null); // State for Media Lightbox

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    // Audio State
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);

    // Reactions State
    const [activeReactionId, setActiveReactionId] = useState(null);
    const reactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    const endOfMessagesRef = useRef(null);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Audio refs
    const sendSoundRef = useRef(new Audio('/send_message.mp3'));
    const notificationSoundRef = useRef(new Audio('/notification.mp3'));

    const getRecipientEmail = (users) => {
        return users?.filter(u => u !== user?.email)?.[0];
    };

    const recipientEmail = getRecipientEmail(chat.users);

    // Robust: Only query if email exists
    const [recipientSnapshot] = useCollection(
        recipientEmail ? query(collection(db, "users"), where("email", "==", recipientEmail)) : null
    );

    const recipient = recipientSnapshot?.docs?.[0]?.data();

    // --- Header Menu State ---
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleClearChat = async () => {
        if (window.confirm("Delete all messages in this chat?")) {
            handleMenuClose(); // Close menu immediately
            try {
                const messagesToDelete = messagesSnapshot.docs;
                // Firestore batch limit is 500. We'll utilize one batch for simplicity for now.
                // If more than 500, we'd need loop functionality.
                const batch = writeBatch(db);
                messagesToDelete.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            } catch (err) {
                console.error("Error clearing chat:", err);
            }
        } else {
            handleMenuClose();
        }
    };

    const handleDeleteChat = async () => {
        if (window.confirm("Delete this entire chat?")) {
            try {
                await deleteDoc(doc(db, "chats", chat.id));
                onBack(); // Go back to empty state
            } catch (err) {
                console.error("Error deleting chat:", err);
            }
        }
        handleMenuClose();
    };

    const handleStartCall = (type) => {
        const name = chat.type === "group" ? chat.groupName : (recipient?.displayName || recipientEmail);
        const photo = chat.type === "group" ? "" : recipient?.photoURL;
        setActiveCall({ name, photo, type });
        // Optional: Play calling sound here if needed, but Overlay can handle it.
    };


    // Listen to the chat document for typing status and last message
    const [chatDocSnapshot] = useDocument(doc(db, "chats", chat.id));
    const recipientTyping = chatDocSnapshot?.data()?.typing?.includes(recipientEmail);

    // --- Header Click Handler ---
    const handleHeaderClick = () => {
        setShowChatInfo(true);
    };

    // Calculate Dynamic Background Style
    const chatBodyStyle = (wallpaper && wallpaper !== 'default') ? {
        backgroundImage: 'none',
        backgroundColor: wallpaper
    } : {};

    // Robust: Only query if chat.id exists
    const messagesRef = chat?.id ? collection(db, "chats", chat.id, "messages") : null;
    const q = messagesRef ? query(messagesRef, orderBy("timestamp", "asc")) : null;
    const [messagesSnapshot] = useCollection(q);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();

        // Mark messages as read and play sound
        if (messagesSnapshot?.docs) {
            const unreadMessages = messagesSnapshot.docs.filter(
                doc => doc.data().sender !== user.email && doc.data().status !== 'read'
            );

            if (unreadMessages.length > 0) {
                const lastMessage = messagesSnapshot.docs[messagesSnapshot.docs.length - 1];
                const isNew = lastMessage.data().timestamp?.toMillis() > (Date.now() - 2000); // 2 seconds threshold
                if (lastMessage.data().sender !== user.email && isNew) {
                    notificationSoundRef.current.play().catch(e => console.log("Audio play failed", e));
                }

                // Batch mark as read
                unreadMessages.forEach(async (msgDoc) => {
                    await setDoc(doc(db, "chats", chat.id, "messages", msgDoc.id), {
                        status: 'read'
                    }, { merge: true });
                });
            }
        }
    }, [messagesSnapshot, chat.id, user.email]);

    const onEmojiClick = (emojiObject) => {
        setInput(prev => prev + emojiObject.emoji);
        setShowPicker(false);
        handleTypingContext();
    };

    const deleteMessage = async (id) => {
        if (window.confirm("Delete this message?")) {
            await deleteDoc(doc(db, "chats", chat.id, "messages", id));
        }
    };

    const formatDateLabel = (date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString();
    };

    const handleTypingContext = async () => {
        // Set typing status
        const chatRef = doc(db, "chats", chat.id);

        // Only update if not already handled by a generic input change logic too often
        // But for simplicity, we assume this is called on change
        // We need to implement the actual typing logic in the input onChange handler primarily
    };

    const handleReaction = async (messageId, emoji) => {
        const messageDoc = messagesSnapshot.docs.find(doc => doc.id === messageId);
        if (!messageDoc) return;

        const messageData = messageDoc.data();
        const currentReactions = messageData.reactions || [];

        // Find if user already reacted
        const existingReactionIndex = currentReactions.findIndex(r => r.user === user.email);

        let newReactions = [...currentReactions];

        if (existingReactionIndex >= 0) {
            // If clicking same emoji, remove it (toggle off)
            if (currentReactions[existingReactionIndex].emoji === emoji) {
                newReactions.splice(existingReactionIndex, 1);
            } else {
                // Change reaction
                newReactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            // Add new reaction
            newReactions.push({ user: user.email, emoji });
        }

        const messageRef = doc(db, "chats", chat.id, "messages", messageId);
        await updateDoc(messageRef, {
            reactions: newReactions
        });

        setActiveReactionId(null);
    };

    const handleStar = async (messageId, currentStarredBy) => {
        const messageRef = doc(db, "chats", chat.id, "messages", messageId);
        const isStarred = currentStarredBy?.includes(user.email);

        if (isStarred) {
            await updateDoc(messageRef, {
                starredBy: arrayRemove(user.email)
            });
        } else {
            await updateDoc(messageRef, {
                starredBy: arrayUnion(user.email)
            });
        }
    };

    const handleReply = (message) => {
        setReplyingTo(message);
        fileInputRef.current?.focus(); // or input focus
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const countReactions = (reactionsList) => {
        if (!reactionsList) return {};
        return reactionsList.reduce((acc, curr) => {
            acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
            return acc;
        }, {});
    };

    const handleInputChange = async (e) => {
        const newValue = e.target.value;
        setInput(newValue);

        if (!chat.id) return;

        const chatRef = doc(db, "chats", chat.id);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Add user to typing array if not already done (could optimize to check local state first)
        // But Firestore arrayUnion is idempotent
        if (newValue.length > 0) {
            await updateDoc(chatRef, {
                typing: arrayUnion(user.email)
            }).catch(err => console.log("Error setting typing:", err));

            // Set timeout to remove typing status
            typingTimeoutRef.current = setTimeout(async () => {
                await updateDoc(chatRef, {
                    typing: arrayRemove(user.email)
                });
            }, 3000);
        } else {
            await updateDoc(chatRef, {
                typing: arrayRemove(user.email)
            });
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return;

        // Play send sound
        sendSoundRef.current.play().catch(e => console.log("Audio play failed", e));

        if (messagesRef) {
            await addDoc(messagesRef, {
                text: input,
                sender: user.email,
                senderName: user.displayName || user.email, // Save display name
                timestamp: serverTimestamp(),
                status: 'sent',
                replyTo: replyingTo ? {
                    id: replyingTo.id,
                    text: replyingTo.text || (replyingTo.image ? "📷 Photo" : (replyingTo.audio ? "🎤 Audio" : "")),
                    sender: replyingTo.sender,
                    senderName: replyingTo.senderName || replyingTo.sender // Save reply sender name
                } : null
            });
            setReplyingTo(null);
        }

        const chatRef = doc(db, "chats", chat.id);
        await setDoc(chatRef, {
            lastMessage: input,
            timestamp: serverTimestamp(),
            typing: arrayRemove(user.email) // Ensure typing is cleared immediately
        }, { merge: true });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Update current user's lastSeen
        await setDoc(doc(db, "users", user.uid), {
            lastSeen: serverTimestamp()
        }, { merge: true });

        setInput("");
    };

    const attachFile = () => {
        fileInputRef.current.click();
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 700 * 1024) { // 700KB limit
            alert("Please select an image smaller than 700KB.");
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            const base64Image = readerEvent.target.result;

            try {
                sendSoundRef.current.play().catch(e => console.log("Audio play failed", e));

                if (messagesRef) {
                    await addDoc(messagesRef, {
                        text: "📷 Image",
                        image: base64Image,
                        sender: user.email,
                        timestamp: serverTimestamp(),
                        status: 'sent'
                    });
                }

                const chatRef = doc(db, "chats", chat.id);
                await setDoc(chatRef, {
                    lastMessage: "📷 Image",
                    timestamp: serverTimestamp()
                }, { merge: true });

                await setDoc(doc(db, "users", user.uid), {
                    lastSeen: serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Failed to send image.");
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // --- Audio Recording Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result;
                    // Send audio message
                    if (messagesRef) {
                        await addDoc(messagesRef, {
                            text: "🎤 Audio",
                            audio: base64Audio,
                            sender: user.email,
                            timestamp: serverTimestamp(),
                            status: 'sent'
                        });
                    }
                    // Update last message
                    const chatRef = doc(db, "chats", chat.id);
                    await setDoc(chatRef, {
                        lastMessage: "🎤 Audio",
                        timestamp: serverTimestamp()
                    }, { merge: true });
                };
                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            sendSoundRef.current.play().catch(e => console.log("Audio play failed", e));
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.onstop = null;
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());

            setIsRecording(false);
            clearInterval(timerRef.current);
            setRecordingTime(0);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Helper to highlight search term
    const highlightText = (text, highlight) => {
        if (!highlight || !text) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ?
                <span key={i} style={{ backgroundColor: '#fff9c4', color: 'black' }}>{part}</span> : part
        );
    };


    return (
        <div className="chat">
            {/* --- Header with Search --- */}
            <div className="chat-header">
                {showSearch ? (
                    <div className="chat-header-search" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => { setShowSearch(false); setSearchTerm(""); }}>
                            <ArrowBack />
                        </IconButton>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search..."
                            style={{
                                border: 'none',
                                outline: 'none',
                                padding: '10px',
                                borderRadius: '8px',
                                flex: 1,
                                marginLeft: '10px'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <IconButton onClick={() => setSearchTerm("")}>
                            <Close />
                        </IconButton>
                    </div>
                ) : (
                    <>
                        <div className="chat-back-button">
                            <IconButton onClick={onBack}>
                                <ArrowBack />
                            </IconButton>
                        </div>
                        <Avatar src={recipient?.photoURL}>
                            {chat.type === "group" ? chat.groupName?.[0] : recipientEmail?.[0]}
                        </Avatar>
                        <div className="chat-header-info" onClick={handleHeaderClick} style={{ cursor: 'pointer' }}>
                            <h3>{chat.type === "group" ? chat.groupName : (recipient?.displayName || recipientEmail)}</h3>
                            <p>
                                {chat.type === "group" ? (
                                    <span style={{ fontSize: '11px' }}>
                                        {chat.users?.length} members
                                    </span>
                                ) : (
                                    recipientTyping ? (
                                        <span style={{ color: "#00a884", fontWeight: "bold", transition: "opacity 0.2s" }}>
                                            typing...
                                        </span>
                                    ) : (
                                        recipient?.lastSeen ? (
                                            recipient.lastSeen.toDate() > new Date(Date.now() - 1000 * 60 * 5) ? (
                                                <span style={{ color: "gray" }}>Online</span>
                                            ) : (
                                                <>Last seen {recipient.lastSeen.toDate ? recipient.lastSeen.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</>
                                            )
                                        ) : (
                                            "Loading..."
                                        )
                                    )
                                )}
                            </p>
                        </div>
                        <div className="header-actions">
                            <IconButton onClick={() => handleStartCall('video')}>
                                <Videocam />
                            </IconButton>
                            <IconButton onClick={() => handleStartCall('audio')}>
                                <Call />
                            </IconButton>
                            <div style={{ height: '20px', borderLeft: '1px solid #d1d7db', margin: '0 5px' }}></div> {/* Separator */}

                            <IconButton onClick={() => setShowSearch(true)}><SearchOutlined /></IconButton>
                            <IconButton onClick={handleMenuOpen}><MoreVert /></IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={openMenu}
                                onClose={handleMenuClose}
                            >
                                <MenuItem onClick={() => { setShowChatInfo(true); handleMenuClose(); }}>Contact Info</MenuItem>
                                <MenuItem onClick={handleClearChat}>Clear messages</MenuItem>
                                <MenuItem onClick={handleDeleteChat}>Delete chat</MenuItem>
                            </Menu>
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={onFileChange}
                                accept="image/*"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* --- Chat Body --- */}
            <div className="chat-body" style={chatBodyStyle}>
                {(messagesSnapshot?.docs || [])
                    .filter(doc => !searchTerm || doc.data().text?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((doc, index, array) => {
                        const message = doc.data();
                        const isSender = message.sender === user.email;
                        const isStarred = message.starredBy && message.starredBy.includes(user.email);

                        // Safe timestamp conversion
                        const getSafeDate = (timestamp) => {
                            return timestamp?.toDate ? timestamp.toDate() : null;
                        };

                        const msgDate = getSafeDate(message.timestamp);
                        const prevMsg = array[index - 1]?.data();
                        const prevDate = getSafeDate(prevMsg?.timestamp);

                        let showDate = false;
                        let dateLabel = "";

                        if (msgDate) {
                            const d1 = formatDateLabel(msgDate);
                            const d2 = prevDate ? formatDateLabel(prevDate) : null;
                            if (d1 !== d2) {
                                showDate = true;
                                dateLabel = d1;
                            }
                        }


                        const reactionCounts = countReactions(message.reactions);
                        const hasReactions = message.reactions && message.reactions.length > 0;

                        return (
                            <React.Fragment key={doc.id}>
                                {showDate && <div className="chat-date-separator"><span>{dateLabel}</span></div>}
                                <div
                                    className={`message ${isSender ? 'chat__receiver' : ''}`}
                                    onMouseEnter={() => { }}
                                    onMouseLeave={() => setActiveReactionId(null)}
                                >
                                    {/* Show sender name in group chats if not me */}
                                    {chat.type === 'group' && !isSender && (
                                        <span className="message-name" style={{ top: '-15px', color: 'orange' }}>
                                            {message.senderName || message.sender}
                                        </span>
                                    )}

                                    {/* Hover Reaction Button */}
                                    <div className={`reaction-btn-container ${isSender ? 'sender' : 'receiver'}`}>
                                        <IconButton
                                            size="small"
                                            className="reaction-trigger-btn"
                                            onClick={() => setActiveReactionId(activeReactionId === doc.id ? null : doc.id)}
                                        >
                                            <InsertEmoticon fontSize="small" />
                                        </IconButton>

                                        <IconButton
                                            size="small"
                                            className="reaction-trigger-btn"
                                            onClick={() => handleStar(doc.id, message.starredBy)}
                                            style={{ color: isStarred ? '#ffd700' : 'gray' }}
                                        >
                                            <Star fontSize="small" />
                                        </IconButton>

                                        <IconButton
                                            size="small"
                                            className="reaction-trigger-btn"
                                            onClick={() => handleReply({ id: doc.id, ...message })}
                                        >
                                            <Reply fontSize="small" />
                                        </IconButton>

                                        {/* Reaction Picker Popover */}
                                        {activeReactionId === doc.id && (
                                            <div className="reaction-picker">
                                                {reactions.map(emoji => (
                                                    <span
                                                        key={emoji}
                                                        onClick={() => handleReaction(doc.id, emoji)}
                                                        className="reaction-option"
                                                    >
                                                        {emoji}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quoted Message Display in Bubble */}
                                    {message.replyTo && (
                                        <div className="message-quote">
                                            <span className="quote-sender">{message.replyTo.senderName || message.replyTo.sender}</span>
                                            <div className="quote-text">{message.replyTo.text}</div>
                                        </div>
                                    )}

                                    {message.image ? (
                                        <img
                                            src={message.image}
                                            alt="shared"
                                            className="message-image"
                                            onClick={() => setViewingImage({
                                                src: message.image,
                                                senderName: message.senderName || message.sender,
                                                timestamp: message.timestamp
                                            })}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    ) : message.audio ? (
                                        <div className="audio-message">
                                            <audio controls src={message.audio} />
                                        </div>
                                    ) : (
                                        <p>{highlightText(message.text, searchTerm)}</p>
                                    )}

                                    <div className="message-meta-row">
                                        {/* Reactions Display */}
                                        {hasReactions && (
                                            <div className="message-reactions">
                                                {Object.entries(reactionCounts).map(([emoji, count]) => (
                                                    <span key={emoji} className="reaction-pill">
                                                        {emoji} {count > 1 && <span className="reaction-count">{count}</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <span className="timestamp">
                                            {isStarred && <Star style={{ fontSize: '12px', color: '#999', marginRight: '3px' }} />}
                                            {message.timestamp?.toDate ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
                                            {isSender && (
                                                <>
                                                    {message.status === 'read' ?
                                                        <DoneAll style={{ fontSize: '15px', marginLeft: '3px', color: '#53bdeb' }} /> :
                                                        (message.status === 'sent' ? <Check style={{ fontSize: '15px', marginLeft: '3px', color: 'gray' }} /> : <DoneAll style={{ fontSize: '15px', marginLeft: '3px', color: 'gray' }} />)
                                                    }
                                                    <span
                                                        className="delete-btn"
                                                        onClick={() => deleteMessage(doc.id)}
                                                        style={{ marginLeft: '5px', cursor: 'pointer' }}
                                                        title="Delete message"
                                                    >
                                                        <Delete style={{ fontSize: '14px', color: '#999' }} />
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                <div ref={endOfMessagesRef} />
            </div>

            {/* --- Chat Footer --- */}
            <div className="chat-footer-container">
                {replyingTo && (
                    <div className="reply-preview">
                        <div className="reply-preview-content">
                            <span style={{ color: '#008069', fontSize: '12px', fontWeight: 'bold' }}>{replyingTo.senderName || replyingTo.sender}</span>
                            <p>{replyingTo.text || (replyingTo.image ? "📷 Photo" : (replyingTo.audio ? "🎤 Audio" : ""))}</p>
                        </div>
                        <IconButton onClick={cancelReply} size="small">
                            <Close fontSize="small" />
                        </IconButton>
                    </div>
                )}
                <div className="chat-footer">
                    {isRecording ? (
                        <div className="recording-ui" style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 10px', color: 'red' }}>
                            <IconButton onClick={cancelRecording}>
                                <Delete style={{ color: 'red' }} />
                            </IconButton>
                            <span style={{ flex: 1, marginLeft: '10px', fontWeight: 'bold' }}>Recording... {formatTime(recordingTime)}</span>
                            <IconButton onClick={stopRecording}>
                                <Send style={{ color: '#008080' }} />
                            </IconButton>
                        </div>
                    ) : (
                        <>
                            {showPicker && (
                                <div className="emoji-picker-container" style={{ position: 'absolute', bottom: '70px', left: '10px', zIndex: 100 }}>
                                    <EmojiPicker onEmojiClick={onEmojiClick} />
                                </div>
                            )}
                            <IconButton onClick={() => setShowPicker(!showPicker)}>
                                <InsertEmoticon />
                            </IconButton>
                            <IconButton onClick={attachFile}>
                                <AttachFile style={{ transform: 'rotate(45deg)' }} />
                            </IconButton>
                            <form onSubmit={sendMessage}>
                                <input
                                    type="text"
                                    placeholder={isUploading ? "Uploading image..." : "Type a message"}
                                    value={input}
                                    onChange={handleInputChange}
                                    onClick={() => setShowPicker(false)}
                                    disabled={isUploading}
                                />
                                <button type="submit" hidden>Send</button>
                            </form>
                            <IconButton onClick={startRecording}>
                                <Mic />
                            </IconButton>
                        </>
                    )}
                </div>
            </div>

            {/* --- Chat Info Drawer --- */}
            <ChatInfoDrawer
                open={showChatInfo}
                onClose={() => setShowChatInfo(false)}
                chat={{ ...chat, recipientName: recipient?.displayName, recipientPhoto: recipient?.photoURL }}
                recipientEmail={recipientEmail}
            />
            {/* --- Media Lightbox --- */}
            {viewingImage && (
                <MediaLightbox
                    src={viewingImage.src}
                    senderName={viewingImage.senderName}
                    timestamp={viewingImage.timestamp}
                    onClose={() => setViewingImage(null)}
                />
            )}
            {/* --- Call Overlay --- */}
            {activeCall && (
                <CallOverlay
                    activeCall={activeCall}
                    onClose={() => setActiveCall(null)}
                />
            )}
        </div>
    );
}

export default Chat;
