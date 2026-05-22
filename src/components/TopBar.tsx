import { useState } from "react";
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
import { resetPasswordApi } from "@/services/authApi";

interface ToastState {
  id: number;
  message: string;
  type: "success" | "error";
}

/* ===============================
   TOKEN TYPE
================================ */
interface DecodedToken {
  name?: string;
  email?: string;
  role?: string;
}

/* ===============================
   FORMAT USER ROLE
================================ */
const formatRole = (role?: string) => {
  if (!role) return "";

  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/* ===============================
   GET USER FROM TOKEN
================================ */
const getUserFromToken = () => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return {
      name: "User",
      role: "",
    };
  }

  try {
    const decoded: DecodedToken = jwtDecode(token);

    return {
      name:
        decoded.name ||
        decoded.email?.split("@")[0] ||
        "User",

      role: formatRole(decoded.role),
    };
  } catch (e) {
    console.error("Error decoding token:", e);

    return {
      name: "User",
      role: "",
    };
  }
};

export default function TopBar() {
  /* ===============================
     STATES
  =============================== */
  const [search, setSearch] = useState("");

  const [bellActive, setBellActive] = useState(false);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [isUpdating, setIsUpdating] = useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [toasts, setToasts] = useState<ToastState[]>([]);

  /* ===============================
     USER DETAILS
  =============================== */
  const { name: userName, role: userRole } =
    getUserFromToken();

  /* ===============================
     SHOW TOAST
  =============================== */
  const showToast = (message: string, type: "success" | "error" = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  /* ===============================
     BELL ANIMATION
  =============================== */
  const handleBell = () => {
    setBellActive(true);

    setTimeout(() => {
      setBellActive(false);
    }, 600);
  };

  /* ===============================
     SEARCH
  =============================== */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Search:", search);
  };

  /* ===============================
     PASSWORD CHANGE
  =============================== */
  const handlePasswordChange = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setIsUpdating(true);

    try {
      const token = localStorage.getItem("accessToken");
      const password = newPassword;

      if (!token) {
        throw new Error("Token not found");
      }

      /* UPDATE PASSWORD */
      const response = await resetPasswordApi({
        token,
        password,
      });

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }

      showToast("Password updated successfully", "success");

      /* RESET */
      setShowPasswordModal(false);

      setNewPassword("");
      setConfirmPassword("");

      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred";

      showToast(message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* ===============================
          TOASTS
      =============================== */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* ===============================
          TOPBAR
      =============================== */}
      <header className={styles.topBar}>
        {/* LEFT SIDE */}
        <div className={styles.topBarLeft}>
          <form
            className={styles.searchForm}
            onSubmit={handleSearch}
          >
            <FaSearch className={styles.searchIcon} />

            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </form>
        </div>

        {/* RIGHT SIDE */}
        <div className={styles.topBarRight}>
          {/* CHANGE PASSWORD */}
          <button
            className={styles.passwordButton}
            onClick={() =>
              setShowPasswordModal(true)
            }
            title="Change Password"
          >
            <FaKey />
          </button>

          {/* NOTIFICATION */}
          <div
            className={`${styles.bell} ${bellActive ? styles.animate : ""
              }`}
            onClick={handleBell}
            title="Notifications"
          >
            <FaBell />

            <span className={styles.badge}></span>
          </div>

          {/* SETTINGS */}
          <div
            className={styles.settingsIcon}
            title="Settings"
          >
            <FaCog />
          </div>

          {/* PROFILE */}
          <div className={styles.profile}>
            <div className={styles.avatar}>
              <FaUserAlt />
            </div>

            <div className={styles.info}>
              <span className={styles.name}>
                {userName}
              </span>

              <span className={styles.role}>
                {userRole || "Member"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ===============================
          PASSWORD MODAL
      =============================== */}
      {showPasswordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            {/* CLOSE BUTTON */}
            <button
              className={styles.closeButton}
              onClick={() =>
                setShowPasswordModal(false)
              }
              title="Close"
            >
              <FaTimes />
            </button>

            <h2>Change Password</h2>

            {/* FORM */}
            <form onSubmit={handlePasswordChange}>
              {/* NEW PASSWORD */}
              <div className={styles.passwordWrapper}>
                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                  title={
                    showNewPassword
                      ? "Hide Password"
                      : "Show Password"
                  }
                >
                  {showNewPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className={styles.passwordWrapper}>
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  required
                />

                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  title={
                    showConfirmPassword
                      ? "Hide Password"
                      : "Show Password"
                  }
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>

              {/* ACTION BUTTONS */}
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
                  disabled={isUpdating}
                >
                  {isUpdating
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}