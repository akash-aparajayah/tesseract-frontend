import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import styles from "../componentStyles/Sidebar.module.css";
import logo from "../assets/unnamed.png";

interface DecodedToken {
  role: string;
}

export default function Sidebar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isProjectHubOpen, setIsProjectHubOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Auto-open Project Hub if on a project-related page
  const isProjectRoute = location.pathname.includes('/dashboard/project') ||
    location.pathname.includes('/dashboard/workspace');

  const token = localStorage.getItem("accessToken");
  let role: DecodedToken | null = null;

  if (token) {
    try {
      role = jwtDecode<DecodedToken>(token);
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const element = e.currentTarget;
    element.classList.add(styles.menuClicked);
    setTimeout(() => {
      element.classList.remove(styles.menuClicked);
    }, 200);
  };

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
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

  const handleLogoutClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoggingOut) return;
    createRipple(e);
    setShowPopup(true);
  };

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
        <div className={styles.sidebarLogo}>
          <img src={logo} alt="BridgeKey Logo" className={styles.logoImage} />
        </div>

        <div className={styles.sidebarNav}>
          {/* General */}
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>General</div>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `${styles.menuItem} ${isActive ? styles.active : ""}`
              }
              onClick={handleMenuClick}
            >
              <div className={styles.sidebarLink}>
                <div className={styles.linkContent}>
                  <i className={`fas fa-tachometer-alt ${styles.sideBarIcon}`}></i>
                  <span className={styles.menuText}>Dashboard</span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Management */}
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>Management</div>

            {role?.role === "SUPER_ADMIN" && (
              <NavLink
                to="/dashboard/admin"
                className={({ isActive }) =>
                  `${styles.menuItem} ${isActive ? styles.active : ""}`
                }
                onClick={handleMenuClick}
              >
                <div className={styles.sidebarLink}>
                  <div className={styles.linkContent}>
                    <i className={`fas fa-user-shield ${styles.sideBarIcon}`}></i>
                    <span className={styles.menuText}>User Hub</span>
                  </div>
                </div>
              </NavLink>
            )}

            {/* Project Hub Dropdown */}
            <div className={styles.dropdownSection}>
              <button
                className={`${styles.dropdownTrigger} ${isProjectHubOpen ? styles.dropdownOpen : ""
                  }`}
                onClick={() => setIsProjectHubOpen(!isProjectHubOpen)}
              >
                <div className={styles.dropdownTriggerContent}>
                  <i className={`fas fa-folder-open ${styles.sideBarIcon}`}></i>
                  <span>Project Hub</span>
                </div>
                <i
                  className={`fas fa-chevron-down ${styles.chevron} ${isProjectHubOpen ? styles.chevronRotate : ""
                    }`}
                ></i>
              </button>

              <div
                className={`${styles.dropdownContent} ${isProjectHubOpen ? styles.dropdownContentOpen : ""
                  }`}
              >
                <NavLink
                  to="/dashboard/project"
                  end
                  className={({ isActive }) =>
                    `${styles.dropdownItem} ${isActive ? styles.active : ""}`
                  }
                  onClick={handleMenuClick}
                >
                  <div className={styles.linkContent}>
                    <i className={`fa-solid fa-border-all ${styles.sideBarIcon}`}></i>
                    <span className={styles.menuText}>Dashboard</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/dashboard/workspace"
                  className={({ isActive }) =>
                    `${styles.dropdownItem} ${isActive ? styles.active : ""}`
                  }
                  onClick={handleMenuClick}
                >
                  <div className={styles.linkContent}>
                    <i className={`fas fa-briefcase ${styles.sideBarIcon}`}></i>
                    <span className={styles.menuText}>Workspace</span>
                  </div>
                </NavLink>
              </div>
            </div>

            <NavLink
              to="/dashboard/report"
              className={({ isActive }) =>
                `${styles.menuItem} ${isActive ? styles.active : ""}`
              }
              onClick={handleMenuClick}
            >
              <div className={styles.sidebarLink}>
                <div className={styles.linkContent}>
                  <i className={`fas fa-chart-bar ${styles.sideBarIcon}`}></i>
                  <span className={styles.menuText}>Report</span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Tools */}
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>Tools</div>
            <NavLink
              to="/dashboard/documentation"
              className={({ isActive }) =>
                `${styles.menuItem} ${isActive ? styles.active : ""}`
              }
              onClick={handleMenuClick}
            >
              <div className={styles.sidebarLink}>
                <div className={styles.linkContent}>
                  <i className={`fas fa-book ${styles.sideBarIcon}`}></i>
                  <span className={styles.menuText}>Documentation</span>
                </div>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Logout */}
        <div className={styles.logoutBtnContainer}>
          <button
            className={`${styles.logoutButton} ${isLoggingOut ? styles.loggingOut : ""}`}
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
            <p>Do you really want to log out of the system?</p>
            <div className={styles.popupActions}>
              <button className={styles.btnNo} onClick={() => setShowPopup(false)}>
                No
              </button>
              <button className={styles.btnYes} onClick={handleConfirmLogout}>
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}