import React from "react";
import styles from "../../componentStyles/loader.module.css";

const Loader: React.FC = () => {
   return (
    <div className={styles.overlay}>
      <div className={styles.spinner}>
        <div className={`${styles.ring} ${styles.ring1}`}></div>
        <div className={`${styles.ring} ${styles.ring2}`}></div>
        <div className={`${styles.ring} ${styles.ring3}`}></div>
        <div className={`${styles.ring} ${styles.ring4}`}></div>

        <div className={styles.centerDot}></div>
      </div>
    </div>
  );

};

export default Loader;