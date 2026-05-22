import { useState, useEffect } from "react";
import {
  FaUserAlt,
  FaSearch,
  FaBell,
  FaKey,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaCog,
} from "react-icons/fa";

import { jwtDecode } from "jwt-decode";

import styles from "../componentStyles/Topbar.module.css";
import Toast from "./common/Toast";
import { updatePasswordApi } from "@/services/authApi";

interface ToastState {
  id: number;
  message: string;
  type: "success" | "error";
}

interface DecodedToken {
  name?: string;
  email?: string;
  role?: string;
}

const formatRole = (role?: string) => {
  if (!role) return "";
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getUserFromToken = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return { name: "User", role: "" };
  }
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return {
      name: decoded.name || decoded.email?.split("@")[0] || "User",
      role: formatRole(decoded.role),
    };
  } catch (e) {
    console.error("Error decoding token:", e);
    return { name: "User", role: "" };
  }
};

export default function TopBar() {
  const [search, setSearch] = useState("");
  const [bellActive, setBellActive] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const { name: userName, role: userRole } = getUserFromToken();

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = (message: string, type: "success" | "error" = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  // Auto‑remove toasts after 5 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), 5000)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts]);

  const handleBell = () => {
    setBellActive(true);
    setTimeout(() => setBellActive(false), 600);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search:", search);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
 
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(newPassword)) {
      showToast("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character", "error");
      return;
    }
    

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token not found");

      const response = await updatePasswordApi({ password: newPassword });

      // Assuming API returns success status 200 or 201
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data?.message || "Failed to update password");
      }

      // ✅ Success: toast + close modal + reset form
      showToast("Password updated successfully", "success");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      console.error("Password update error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update password";
      showToast(errorMessage, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Toast container with proper z-index */}
      <div className="toast-container" style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        <div className={styles.topBarRight}>
          <button
            className={styles.passwordButton}
            onClick={() => setShowPasswordModal(true)}
            title="Change Password"
          >
            <FaKey />
          </button>

          <div
            className={`${styles.bell} ${bellActive ? styles.animate : ""}`}
            onClick={handleBell}
            title="Notifications"
          >
            <FaBell />
            <span className={styles.badge}></span>
          </div>

          <div className={styles.settingsIcon} title="Settings">
            <FaCog />
          </div>

          <div className={styles.profile}>
            <div className={styles.avatar}>
              <FaUserAlt />
            </div>
            <div className={styles.info}>
              <span className={styles.name}>{userName}</span>
              <span className={styles.role}>{userRole || "Member"}</span>
            </div>
          </div>
        </div>
      </header>

      {showPasswordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <button
              className={styles.closeButton}
              onClick={() => setShowPasswordModal(false)}
              title="Close"
            >
              <FaTimes />
            </button>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? "Hide Password" : "Show Password"}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Hide Password" : "Show Password"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton} disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}