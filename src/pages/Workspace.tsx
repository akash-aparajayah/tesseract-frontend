// Workspace.tsx
import styles from "../styles/Workspace.module.css";

export default function Workspace() {
    return (
        <div className={styles.workspaceContainer}>
            <div className={styles.workspaceCard}>
                <div className={styles.iconWrapper}>
                    <i className="fas fa-briefcase"></i>
                </div>
                <h1 className={styles.workspaceTitle}>Welcome to Workspace</h1>
                <p className={styles.workspaceSubtitle}>
                    Your project management hub is ready. Start building something great.
                </p>
            </div>
        </div>
    );
}