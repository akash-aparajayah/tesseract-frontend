// src/components/NotFound/NotFound.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notFoundGif from '../../assets/404-error-page.gif';
import styles from './NotFound.module.css';

const NotFound = () => {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className={styles.container}>
            {/* Full screen GIF background */}
            <img
                src={notFoundGif}
                alt="Page not found"
                className={styles.fullScreenGif}
                style={{ opacity: imageLoaded ? 1 : 0 }}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />

            {/* Buttons overlay at bottom */}
            <div className={styles.overlay}>
                <div className={styles.actions}>
                    <button onClick={handleGoToDashboard} className={`${styles.button} ${styles.primaryButton}`}>
                        Back to Dashboard
                    </button>
                    <button onClick={handleGoBack} className={`${styles.button} ${styles.secondaryButton}`}>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;