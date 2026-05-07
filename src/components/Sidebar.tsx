import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../styles/Sidebar.css";

// Replace with your actual logo path
import logo from "../assets/unnamed.png";

interface DecodedToken {
  role: string;
}

export default function Sidebar() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  // Get user role from JWT token (if any)
  const token = localStorage.getItem("accessToken");
  let role: DecodedToken | null = null;
  if (token) {
    try {
      role = jwtDecode<DecodedToken>(token);
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  // Click animation for menu items
  const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const element = e.currentTarget;
    element.classList.add("menu-clicked");
    setTimeout(() => element.classList.remove("menu-clicked"), 200);
  };

  // Logout flow
  const handleConfirmLogout = () => {
    setShowPopup(false);
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsLoggingOut(false);
      localStorage.clear();
      navigate("/");
    }, 2000);
  };

  // Ripple effect for logout button
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    button.style.position = "relative";
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleLogoutClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoggingOut) return;
    createRipple(e);
    setShowPopup(true);
  };

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={logo} alt="BridgeKey Logo" />
        </div>

        {/* Navigation sections */}
        <div className="sidebar-nav">
          {/* General */}
          <div className="nav-section">
            <div className="section-title">General</div>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
              onClick={handleMenuClick}
            >
              <div className="sidebar-link">
                <div className="link-content">
                  <i className="fas fa-tachometer-alt sideBar-icon"></i>
                  <span className="menu-text">Self Dashboard</span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Project Management */}
          <div className="nav-section">
            <div className="section-title">Project Management</div>
            {role?.role === "SUPER_ADMIN" && (
              <NavLink
                to="/dashboard/admin"
                className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
                onClick={handleMenuClick}
              >
                <div className="sidebar-link">
                  <div className="link-content">
                    <i className="fas fa-user-shield sideBar-icon"></i>
                    <span className="menu-text">User Management</span>
                  </div>
                </div>
              </NavLink>
            )}
            <NavLink
              to="/dashboard/project"
              className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
              onClick={handleMenuClick}
            >
              <div className="sidebar-link">
                <div className="link-content">
                  <i className="fas fa-folder-open sideBar-icon"></i>
                  <span className="menu-text">Project Management</span>
                </div>
              </div>
            </NavLink>
            <NavLink
              to="/dashboard/report"
              className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
              onClick={handleMenuClick}
            >
              <div className="sidebar-link">
                <div className="link-content">
                  <i className="fas fa-chart-bar sideBar-icon"></i>
                  <span className="menu-text">Report</span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Tools */}
          <div className="nav-section">
            <div className="section-title">Tools</div>
            <NavLink
              to="/dashboard/documentation"
              className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
              onClick={handleMenuClick}
            >
              <div className="sidebar-link">
                <div className="link-content">
                  <i className="fas fa-book sideBar-icon"></i>
                  <span className="menu-text">Documentation</span>
                </div>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Logout button */}
        <div className="logout-btn-container">
          <button
            className={`logout-button ${isLoggingOut ? "logging-out" : ""}`}
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

      {/* Logout confirmation popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Are you sure?</h3>
            <p>Do you really want to log out of the system?</p>
            <div className="popup-actions">
              <button className="btn-no" onClick={() => setShowPopup(false)}>
                No
              </button>
              <button className="btn-yes" onClick={handleConfirmLogout}>
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}