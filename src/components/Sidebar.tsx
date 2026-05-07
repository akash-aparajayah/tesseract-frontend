import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import styles from "../componentStyles/Sidebar.module.css";

import logo from "../assets/unnamed.png";

interface DecodedToken {
  role: string;
}

export default function Sidebar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const navigate = useNavigate();

  // Get role from token
  const token = localStorage.getItem("accessToken");

  let role: DecodedToken | null = null;

  if (token) {
    try {
      role = jwtDecode<DecodedToken>(token);
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  // Menu click animation
  const handleMenuClick = (
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    const element = e.currentTarget;

    element.classList.add(styles.menuClicked);

    setTimeout(() => {
      element.classList.remove(styles.menuClicked);
    }, 200);
  };

  // Ripple effect
  const createRipple = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const button = event.currentTarget;

    const rect = button.getBoundingClientRect();

    const size = Math.max(rect.width, rect.height);

    const x = event.clientX - rect.left - size / 2;

    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");

    ripple.classList.add(styles.ripple);

    ripple.style.width = ripple.style.height = `${size}px`;

    ripple.style.left = `${x}px`;

    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  // Logout click
  const handleLogoutClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (isLoggingOut) return;

    createRipple(e);

    setShowPopup(true);
  };

  // Confirm logout
  const handleConfirmLogout = () => {
    setShowPopup(false);

    setIsLoggingOut(true);

    setTimeout(() => {
      setIsLoggingOut(false);

      localStorage.clear();

      navigate("/");
    }, 2000);
  };

  return (
    <>
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <img
            src={logo}
            alt="BridgeKey Logo"
            className={styles.logoImage}
          />
        </div>

        {/* Navigation */}
        <div className={styles.sidebarNav}>
          {/* General */}
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>
              General
            </div>

            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `${styles.menuItem} ${
                  isActive ? styles.active : ""
                }`
              }
              onClick={handleMenuClick}
            >
              <div className={styles.sidebarLink}>
                <div className={styles.linkContent}>
                  <i
                    className={`fas fa-tachometer-alt ${styles.sideBarIcon}`}
                  ></i>

                  <span className={styles.menuText}>
                    Self Dashboard
                  </span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Management */}
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>
              Management
            </div>

            {role?.role === "SUPER_ADMIN" && (
              <NavLink
                to="/dashboard/admin"
                className={({ isActive }) =>
                  `${styles.menuItem} ${
                    isActive ? styles.active : ""
                  }`
                }
                onClick={handleMenuClick}
              >
                <div className={styles.sidebarLink}>
                  <div className={styles.linkContent}>
                    <i
                      className={`fas fa-user-shield ${styles.sideBarIcon}`}
                    ></i>

                    <span className={styles.menuText}>
                      User Management
                    </span>
                  </div>
                </div>
              </NavLink>
            )}

            <NavLink
              to="/dashboard/project"
              className={({ isActive }) =>
                `${styles.menuItem} ${
                  isActive ? styles.active : ""
                }`
              }
              onClick={handleMenuClick}
            >
              <div className={styles.sidebarLink}>
                <div className={styles.linkContent}>
                  <i
                    className={`fas fa-folder-open ${styles.sideBarIcon}`}
                  ></i>

                  <span className={styles.menuText}>
                    Project Management
                  </span>
                </div>
              </div>
            </NavLink>

            <NavLink
              to="/dashboard/report"
              className={({ isActive }) =>
                `${styles.menuItem} ${
                  isActive ? styles.active : ""
                }`
              }
              onClick={handleMenuClick}
            >
              <div className={styles.sidebarLink}>
                <div className={styles.linkContent}>
                  <i
                    className={`fas fa-chart-bar ${styles.sideBarIcon}`}
                  ></i>

                  <span className={styles.menuText}>
                    Report
                  </span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Tools */}
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>
              Tools
            </div>

            <NavLink
              to="/dashboard/documentation"
              className={({ isActive }) =>
                `${styles.menuItem} ${
                  isActive ? styles.active : ""
                }`
              }
              onClick={handleMenuClick}
            >
              <div className={styles.sidebarLink}>
                <div className={styles.linkContent}>
                  <i
                    className={`fas fa-book ${styles.sideBarIcon}`}
                  ></i>

                  <span className={styles.menuText}>
                    Documentation
                  </span>
                </div>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Logout */}
        <div className={styles.logoutBtnContainer}>
          <button
            className={`${styles.logoutButton} ${
              isLoggingOut ? styles.loggingOut : ""
            }`}
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <i className="fas fa-spinner fa-pulse"></i>

                <span>Logging out...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sign-out-alt"></i>

                <span>Log Out</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Popup */}
      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h3>Are you sure?</h3>

            <p>
              Do you really want to log out of the
              system?
            </p>

            <div className={styles.popupActions}>
              <button
                className={styles.btnNo}
                onClick={() => setShowPopup(false)}
              >
                No
              </button>

              <button
                className={styles.btnYes}
                onClick={handleConfirmLogout}
              >
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}