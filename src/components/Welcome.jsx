import React from 'react';
import './Welcome.css';
import { Lock } from '@mui/icons-material';

function Welcome() {
    // Using the generated artifact path (assuming it was copied or we use a public placeholder if local file access is tricky in browser, 
    // but here we use the one we just made. 
    // Since I cannot "copy" it easily to src without a command, I will use a reliable placeholder OR 
    // if the user environment supports it, I'd move it. 
    // I will use a placeholder URL for the "generated" look or similar vector.)
    // For now, I'll use a reliable clean vector URL since I can't guarantee local file serving without move.
    const illustration = "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png"; // Placeholder background actually? 
    // Let's use a better "Connect" illustration.
    const connectIllustration = "https://cdni.iconscout.com/illustration/premium/thumb/web-chat-illustration-download-in-svg-png-gif-file-formats--online-conversation-messaging-application-pack-network-communication-illustrations-4462947.png";

    return (
        <div className="welcome">
            <img src={connectIllustration} alt="Welcome" />

            <h2>Download PingMe for Windows</h2>
            <p>
                Make calls, share your screen and get a faster experience when you download the Windows app.
            </p>
            <div style={{ marginTop: '30px' }}>
                <button className="get-app-btn" style={{
                    backgroundColor: 'var(--primary-green)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    Get the app
                </button>
            </div>

            <div className="welcome-footer">
                <Lock style={{ fontSize: '12px' }} /> End-to-end encrypted
            </div>
        </div>
    );
}

export default Welcome;
