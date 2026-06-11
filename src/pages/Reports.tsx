import React from "react";
import styles from "../styles/reports.module.css";

const Reports: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.icon}>🚧</div>

                <h1 className={styles.title}>
                    Under Development
                </h1>

                <p className={styles.description}>
                    The Reports module is currently under development.
                    New features and reports will be available soon.
                </p>
            </div>
        </div>
    );
};

export default Reports;