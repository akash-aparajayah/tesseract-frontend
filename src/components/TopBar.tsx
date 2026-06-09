import { useState, useEffect } from "react";
import {
  FaUserAlt,
  FaBell,
  FaKey,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
  FaLock,
} from "react-icons/fa";

import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

import styles from "../componentStyles/Topbar.module.css";
import Toast from "./common/Toast";
import { updatePasswordApi, updatePasskeyApi, } from "@/services/authApi";
import GlobalSearch from "./common/GlobalSearch";

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

interface Props {
  projects?: any[];
  environments?: any[];
  providers?: any[];
  users?: any[];
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

export default function TopBar({
  projects = [],
  environments = [],
  providers = [],
  users = [],
}: Props) {
  const navigate = useNavigate();

  const [bellActive, setBellActive] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // fOR PASSKEY
  const [currentPasskey, setCurrentPasskey] = useState("");
  const [newPasskey, setNewPasskey] = useState("");
  const [confirmPasskey, setConfirmPasskey] = useState("");

  const [showCurrentPasskey, setShowCurrentPasskey] = useState(false);
  const [showNewPasskey, setShowNewPasskey] = useState(false);
  const [showConfirmPasskey, setShowConfirmPasskey] = useState(false);

  const [activeSecurityTab, setActiveSecurityTab] =
    useState<"password" | "passkey">("password");

  // Profile dropdown state management
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<number | null>(null);

  // Logout states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
 * Handles mouse enter event on profile section
 * Clears any existing timeout to prevent dropdown from closing
 * Shows the dropdown menu
 */
  const handleProfileMouseEnter = () => {
    if (dropdownTimeout !== null) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setShowDropdown(true);
  };

  /**
 * Navigates to profile page with password tab active
 * This is a placeholder for future profile editing features
 * Currently redirects to the same page as change password
 */
  const handleChangeProfile = () => {
    setShowDropdown(false);
    navigate("/profile?tab=password"); // For now, goes to password tab as placeholder
  };

  const handleProfileMouseLeave = () => {
    const timeout = window.setTimeout(() => {
      setShowDropdown(false);
    }, 200); // 200ms delay for better UX
    setDropdownTimeout(timeout);
  };

  const handleDropdownMouseEnter = () => {
    if (dropdownTimeout !== null) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setShowDropdown(true);
  };

  const handleDropdownMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowDropdown(false);
    }, 200);
    setDropdownTimeout(timeout);
  };

  const handleChangePassword = () => {
    setShowDropdown(false);
    navigate("/dashboard/profile?tab=password");
  };

  const handleChangePasskey = () => {
    setShowDropdown(false);
    navigate("/dashboard/profile?tab=passkey");
  };

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

  const handlePasskeyChange = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (
      !/^\d{6}$/.test(currentPasskey)
    ) {
      showToast(
        "Current passkey must be 6 digits",
        "error"
      );
      return;
    }

    if (
      !/^\d{6}$/.test(newPasskey)
    ) {
      showToast(
        "New passkey must be 6 digits",
        "error"
      );
      return;
    }

    if (
      newPasskey !== confirmPasskey
    ) {
      showToast(
        "Passkeys do not match",
        "error"
      );
      return;
    }

    try {

      const response =
        await updatePasskeyApi({
          currentPasskey,
          newPasskey,
        });

      if (
        response.status !== 200
      ) {
        throw new Error(
          response.data?.message
        );
      }

      showToast(
        "Credential passkey updated successfully",
        "success"
      );

      setCurrentPasskey("");
      setNewPasskey("");
      setConfirmPasskey("");

    } catch (err: any) {

      showToast(
        err?.response?.data?.message ||
        "Failed to update passkey",
        "error"
      );

    }
  };

  // Logout handlers
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.clear();
      navigate("/");
    }, 1000);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
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
          <GlobalSearch
            projects={projects}
            environments={environments}
            providers={providers}
            users={users}
          />
        </div>

        <div className={styles.topBarRight}>
          {/* Notification Bell - Triggers shake animation on click */}
          <div
            className={`${styles.bell} ${bellActive ? styles.animate : ""}`}
            onClick={handleBell}
            title="Notifications"
          >
            <FaBell />
            <span className={styles.badge}></span>
          </div>

          {/* Settings Icon - Navigates to settings page */}
          <div className={styles.settingsIcon} title="Settings">
            <FaCog />
          </div>

          {/* Logout Button - Direct logout trigger with confirmation */}
          <button
            className={styles.logoutButton}
            onClick={handleLogoutClick}
            title="Logout"
          >
            <FaSignOutAlt />
          </button>

          {/* Profile Section with Hover Dropdown Menu */}
          <div
            className={styles.profileWrapper}
            onMouseEnter={handleProfileMouseEnter}
            onMouseLeave={handleProfileMouseLeave}
          >
            {/* Profile Display - Shows avatar, name, role and dropdown chevron */}
            <div className={styles.profile}>
              <div className={styles.avatar}>
                <FaUserAlt />
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{userName}</span>
                <span className={styles.role}>{userRole || "Member"}</span>
              </div>
              <FaChevronDown className={styles.chevronIcon} />
            </div>

            {/* 
      Profile Dropdown Menu
      Appears on hover with user-related actions
      Includes: Change Password, Change Passkey, Logout
    */}
            {showDropdown && (
              <div
                className={styles.profileDropdown}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >

                {/* Change Profile Option - First item with user icon */}
                <button
                  className={styles.dropdownItem}
                  onClick={handleChangeProfile}
                >
                  <FaUserAlt className={styles.dropdownIcon} />
                  <span>Change Profile</span>
                </button>

                {/* Change Password Option */}
                <button
                  className={styles.dropdownItem}
                  onClick={handleChangePassword}
                >
                  <FaLock className={styles.dropdownIcon} />
                  <span>Change Password</span>
                </button>

                {/* Change Credential Passkey Option */}
                <button
                  className={styles.dropdownItem}
                  onClick={handleChangePasskey}
                >
                  <FaKey className={styles.dropdownIcon} />
                  <span>Change Passkey</span>
                </button>

                {/* Divider between profile actions and logout */}
                <div className={styles.dropdownDivider}></div>

                {/* Logout Option - Styled differently with red hover */}
                <button
                  className={`${styles.dropdownItem} ${styles.logoutDropdownItem}`}
                  onClick={handleLogoutClick}
                >
                  <FaSignOutAlt className={styles.dropdownIcon} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 className={styles.securitySectionTitle}>
                Security Settings
              </h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowPasswordModal(false)}
                title="Close"
                style={{ marginLeft: 0 }}
              >
                <FaTimes />
              </button>
            </div>
            <div className={styles.securityTabs}>
              <button
                type="button"
                className={
                  activeSecurityTab === "password"
                    ? `${styles.securityTab} ${styles.securityTabActive}`
                    : styles.securityTab
                }
                onClick={() =>
                  setActiveSecurityTab("password")
                }
              >
                Password
              </button>

              <button
                type="button"
                className={
                  activeSecurityTab === "passkey"
                    ? `${styles.securityTab} ${styles.securityTabActive}`
                    : styles.securityTab
                }
                onClick={() =>
                  setActiveSecurityTab("passkey")
                }
              >
                Credential Passkey
              </button>
            </div>
            {activeSecurityTab === "password" && (
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
            )}
            {activeSecurityTab === "passkey" && (
              <form onSubmit={handlePasskeyChange}>

                <div className={styles.passwordWrapper}>
                  <input
                    type={showCurrentPasskey ? "text" : "password"}
                    placeholder="Current Passkey"
                    value={currentPasskey}
                    onChange={(e) =>
                      setCurrentPasskey(e.target.value)
                    }
                    maxLength={6}
                    required
                  />

                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() =>
                      setShowCurrentPasskey(!showCurrentPasskey)
                    }
                  >
                    {showCurrentPasskey ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>
                </div>

                <div className={styles.passwordWrapper}>
                  <input
                    type={showNewPasskey ? "text" : "password"}
                    placeholder="New Passkey"
                    value={newPasskey}
                    onChange={(e) =>
                      setNewPasskey(e.target.value)
                    }
                    maxLength={6}
                    required
                  />

                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() =>
                      setShowNewPasskey(!showNewPasskey)
                    }
                  >
                    {showNewPasskey ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>
                </div>

                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPasskey ? "text" : "password"}
                    placeholder="Confirm Passkey"
                    value={confirmPasskey}
                    onChange={(e) =>
                      setConfirmPasskey(e.target.value)
                    }
                    maxLength={6}
                    required
                  />

                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() =>
                      setShowConfirmPasskey(
                        !showConfirmPasskey
                      )
                    }
                  >
                    {showConfirmPasskey ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() =>
                      setShowPasswordModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={styles.saveButton}
                  >
                    Update Passkey
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: "400px" }}>
            <div className={styles.logoutModalHeader}>
              <h2 className={styles.logoutModalTitle}>
                Confirm Logout
              </h2>
              <button
                className={styles.logoutCloseButton}
                onClick={handleCancelLogout}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
            <p style={{ color: "#64748b", marginBottom: "24px" }}>
              Are you sure you want to logout from your account?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelLogout}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                style={{
                  background: isLoggingOut ? "#94a3b8" : "#ef4444",
                  cursor: isLoggingOut ? "not-allowed" : "pointer",
                  opacity: isLoggingOut ? 0.7 : 1
                }}
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}