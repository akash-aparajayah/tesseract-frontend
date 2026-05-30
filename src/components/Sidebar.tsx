import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import styles from "../componentStyles/Sidebar.module.css";
import logo from "../assets/unnamed.png";

interface DecodedToken {
  role: string;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProjectHubOpen, setIsProjectHubOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const navigate = useNavigate();
  const location = useLocation();

  // Track window width and auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);

      if (width <= 768) {
        setIsCollapsed(true); // Always force collapse on mobile
      } else {
        setIsCollapsed(false); // Auto-expand on larger screens
      }
    };

    // Check on initial load
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update CSS variable when sidebar collapses/expands
  useEffect(() => {
    const root = document.documentElement;
    if (isCollapsed) {
      root.style.setProperty("--sidebar-width", "80px");
    } else {
      root.style.setProperty("--sidebar-width", "250px");
    }
  }, [isCollapsed]);

  // Auto-open Project Hub if on a project-related page
  useEffect(() => {
    const isProjectRoute =
      location.pathname.includes("/dashboard/project") ||
      location.pathname.includes("/dashboard/workspace");

    if (isProjectRoute) {
      setIsProjectHubOpen(true);
    }
  }, [location.pathname]);

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

  const toggleSidebar = () => {
    // Prevent expanding on mobile screens (768px and below)
    if (windowWidth <= 768) {
      return; // Completely block toggle on mobile
    }

    // On larger screens, toggle normally
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
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
              title={isCollapsed ? "Dashboard" : ""}
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
                title={isCollapsed ? "User Hub" : ""}
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
                title={isCollapsed ? "Project Hub" : ""}
              >
                <div className={styles.dropdownTriggerContent}>
                  <i className={`fas fa-folder-open ${styles.sideBarIcon}`}></i>
                  <span className={styles.menuText}>Project Hub</span>
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
                  title={isCollapsed ? "Project Dashboard" : ""}
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
                  title={isCollapsed ? "Workspace" : ""}
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
              title={isCollapsed ? "Report" : ""}
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
              title={isCollapsed ? "Documentation" : ""}
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

        {/* Collapse/Expand Button */}
        <div className={styles.collapseBtnContainer}>
          <button
            className={styles.collapseButton}
            onClick={toggleSidebar}
            disabled={windowWidth <= 768}
            title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
            style={windowWidth <= 768 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <span className={styles.collapseIcon}>
              {isCollapsed ? (
                <i className="fas fa-chevron-circle-right"></i>
              ) : (
                <i className="fas fa-chevron-circle-left"></i>
              )}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}