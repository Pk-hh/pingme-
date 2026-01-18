import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import Welcome from './components/Welcome';
import Login from './components/Login';
import { auth, db } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [user, loading] = useAuthState(auth);
  const [selectedChat, setSelectedChat] = useState(null);
  const [wallpaper, setWallpaper] = useState('default'); // 'default' or hex color

  useEffect(() => {
    if (user) {
      const updateStatus = async () => {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastSeen: serverTimestamp()
        }, { merge: true });
      };

      updateStatus();

      // Request Notification Permission
      if ("Notification" in window) {
        Notification.requestPermission();
      }

      // Update last seen every 60 seconds
      const interval = setInterval(updateStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <img
            src="/logo.png"
            alt="PingMe"
            className="loading-logo"
          />
          <div className="loading-progress">
            <div className="loading-bar"></div>
          </div>
          <div className="loading-text">Loading chats...</div>
        </div>
        <div className="from-branding">
          <span>from</span>
          <strong>Electron Studios</strong>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className={`app-body ${selectedChat ? 'chat-selected' : ''}`}>
      <Sidebar
        user={user}
        onSelectChat={setSelectedChat}
        selectedChat={selectedChat}
        setWallpaper={setWallpaper}
        currentWallpaper={wallpaper}
      />
      {selectedChat ? (
        <Chat
          chat={selectedChat}
          user={user}
          onBack={() => setSelectedChat(null)}
          wallpaper={wallpaper}
        />
      ) : (
        <div className="welcome-container">
          <Welcome />
        </div>
      )}
    </div>
  );
}

export default App;

