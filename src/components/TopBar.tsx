import { useState } from "react";
import {
  FaUserAlt,
  FaSearch,
  FaBell,
  FaKey,
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import styles from "../componentStyles/Topbar.module.css";
import Toast from "./common/Toast";

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
  const [isUpdating, setIsUpdating] = useState(false); // NEW: loading state

  const { name: userName, role: userRole } = getUserFromToken();

  const handleBell = () => {
    setBellActive(true);
    setTimeout(() => {
      setBellActive(false);
    }, 600);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search:", search);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsUpdating(true); // disable button, show loading

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:5000/api/users/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      alert("Password updated successfully");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Toast(error.message);
    } finally {
      setIsUpdating(false); // re-enable button
    }
  };

  return (
    <>
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
          >
            <FaKey />
            {/* <span>Change Password</span> */}
          </button>

          <div
            className={`${styles.bell} ${bellActive ? styles.animate : ""}`}
            onClick={handleBell}
          >
            <FaBell />
            <span className={styles.badge}></span>
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
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isUpdating}
                >
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