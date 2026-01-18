import React, { useEffect } from 'react';
import './MediaLightbox.css';
import { IconButton } from '@mui/material';
import { Close, Download } from '@mui/icons-material';

function MediaLightbox({ src, onClose, senderName, timestamp }) {

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = `pingme-image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="media-lightbox-overlay" onClick={onClose}>
            <div className="media-lightbox-container" onClick={(e) => e.stopPropagation()}>
                <div className="media-lightbox-header">
                    <IconButton className="media-control-btn" onClick={handleDownload} title="Download">
                        <Download />
                    </IconButton>
                    <IconButton className="media-control-btn" onClick={onClose} title="Close">
                        <Close />
                    </IconButton>
                </div>

                <img src={src} alt="Full view" className="media-lightbox-image" />

                <div className="media-lightbox-footer">
                    <span>{senderName} • {timestamp ? new Date(timestamp.toDate()).toLocaleString() : ''}</span>
                </div>
            </div>
        </div>
    );
}

export default MediaLightbox;
