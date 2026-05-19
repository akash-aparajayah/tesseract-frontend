import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/userDetail.module.css";
import {
  ArrowLeft,
  Mail,
  Shield,
  Briefcase,
  AlertCircle,
  Calendar,
  Eye,
  X,
  Server,
  Globe,
  FolderOpen,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { getUserByIdApi } from "../services/adminApi";
import Loader from "@/components/common/Loader";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN" | "USER";
  active: boolean;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  environment?: {
    type: string;
    variables: { key: string; value: string }[];
    region: string;
    version: string;
  };
}

// Mock data – only assigned projects (no available projects)
const MOCK_ASSIGNED_PROJECTS: Project[] = [
  {
    id: "1",
    name: "E-Commerce Platform",
    description: "Frontend + Backend integration",
    environment: {
      type: "Production",
      variables: [
        { key: "API_URL", value: "https://api.ecom.com/v1" },
        { key: "NODE_ENV", value: "production" },
      ],
      region: "us-east-1",
      version: "2.3.0",
    },
  },
  {
    id: "2",
    name: "Mobile App",
    description: "React Native cross-platform",
    environment: {
      type: "Staging",
      variables: [
        { key: "API_URL", value: "https://staging-api.mobile.com" },
        { key: "ENV", value: "staging" },
      ],
      region: "eu-west-2",
      version: "1.7.0",
    },
  },
  {
    id: "3",
    name: "Analytics Dashboard",
    description: "Real-time data visualization",
    environment: {
      type: "Development",
      variables: [{ key: "API_KEY", value: "dev-123" }],
      region: "us-west-2",
      version: "0.5.0",
    },
  },
];

const UserDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        setUser({
          id: id || "1",
          name: "John Doe",
          email: "john.doe@example.com",
          role: "USER",
          active: true,
          createdAt: new Date().toISOString(),
        });
        setAssignedProjects(MOCK_ASSIGNED_PROJECTS);
        setLoading(false);
      }
    }, 1000);

    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        let userData;
        try {
          userData = await getUserByIdApi(id);
          userData = userData?.data?.user || userData?.data || userData;
        } catch (apiErr) {
          userData = {
            id,
            name: "Demo User",
            email: "demo@example.com",
            role: "USER",
            active: true,
            createdAt: new Date().toISOString(),
          };
        }
        if (isMounted) {
          setUser(userData);
          setAssignedProjects(MOCK_ASSIGNED_PROJECTS);
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to load user");
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [id]);

  const handleToggleUserStatus = () => {
    if (user) {
      setUser({ ...user, active: !user.active });
    }
  };

  const handleViewEnvironment = (project: Project) => {
    setSelectedProject(project);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedProject(null);
  };

  const getRoleDisplay = () => {
    switch (user?.role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Admin";
      default:
        return "User";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredAssignedProjects = useMemo(() => {
    if (!globalSearch.trim()) return assignedProjects;
    return assignedProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (p.description &&
          p.description.toLowerCase().includes(globalSearch.toLowerCase()))
    );
  }, [assignedProjects, globalSearch]);

  if (loading) return <Loader />;
  if (error || !user) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} />
        <h3>Error loading user</h3>
        <p>{error || "User not found"}</p>
        <button
          onClick={() => navigate("/dashboard/admin")}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} /> Back to Admin Panel
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.twoColumnLayout}>
        {/* LEFT COLUMN: User Info Card */}
        <div className={styles.userInfoCard}>
          <div className={styles.profileSection}>
            <div className={styles.profileIconLarge}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className={styles.profileName}>{user.name}</h2>
            <div className={styles.profileEmail}>
              <Mail size={14} /> {user.email}
            </div>
            <div className={styles.profileRole}>
              <Shield size={14} /> Role: {getRoleDisplay()}
            </div>
            <div className={styles.profileJoined}>
              <Calendar size={14} /> Joined {formatDate(user.createdAt)}
            </div>
            <div className={styles.statusToggleRow}>
              <span className={styles.toggleLabel}>Account Status</span>
              <button
                className={styles.toggleButton}
                onClick={handleToggleUserStatus}
              >
                {user.active ? (
                  <ToggleRight size={28} className={styles.toggleOn} />
                ) : (
                  <ToggleLeft size={28} className={styles.toggleOff} />
                )}
              </button>
              <span
                className={
                  user.active ? styles.statusActiveText : styles.statusInactiveText
                }
              >
                {user.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Projects Section (view-only) */}
        <div className={styles.projectsSection}>
          <div className={styles.sectionHeader}>
            <h3>
              <Briefcase size={18} /> Assigned Projects
              <span className={styles.projectCount}>
                {filteredAssignedProjects.length}
              </span>
            </h3>
          </div>

          {/* Global search */}
          <div className={styles.globalSearchWrapper}>
            <Search size={16} className={styles.globalSearchIcon} />
            <input
              type="text"
              placeholder="Search assigned projects..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className={styles.globalSearchInput}
            />
          </div>

          {/* Scrollable project grid */}
          <div className={styles.projectGrid}>
            {filteredAssignedProjects.length === 0 ? (
              <div className={styles.noProjects}>
                <Briefcase size={32} />
                <p>No projects assigned.</p>
              </div>
            ) : (
              filteredAssignedProjects.map((project) => (
                <div key={project.id} className={styles.projectCard}>
                  <div className={styles.cardContent}>
                    <div className={styles.folderIcon}>
                      <FolderOpen size={28} />
                    </div>
                    <div className={styles.projectInfo}>
                      <strong>{project.name}</strong>
                      {project.description && <p>{project.description}</p>}
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => handleViewEnvironment(project)}
                        className={styles.viewBtn}
                        title="View environment details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Side Drawer for Environment Details */}
      {drawerOpen && selectedProject && (
        <>
          <div className={styles.drawerOverlay} onClick={closeDrawer} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h3>Environment Details</h3>
              <button onClick={closeDrawer} className={styles.closeDrawerBtn}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.drawerContent}>
              <div className={styles.envSummary}>
                <p>
                  <strong>{selectedProject.name}</strong> –{" "}
                  {selectedProject.environment?.type || "No environment"}
                </p>
              </div>
              <div className={styles.envCards}>
                <div className={styles.envCard}>
                  <div className={styles.envCardIcon}>
                    <Server size={20} />
                  </div>
                  <h4>Variables</h4>
                  <div className={styles.envVarList}>
                    {selectedProject.environment?.variables?.map((v, idx) => (
                      <div key={idx} className={styles.envVar}>
                        <span className={styles.envKey}>{v.key}</span>
                        <span className={styles.envValue}>{v.value}</span>
                      </div>
                    )) || <span>No variables</span>}
                  </div>
                </div>
                <div className={styles.envCard}>
                  <div className={styles.envCardIcon}>
                    <Globe size={20} />
                  </div>
                  <h4>System & Region</h4>
                  <div className={styles.envDetailRow}>
                    <span>Region:</span>
                    <strong>{selectedProject.environment?.region || "unknown"}</strong>
                  </div>
                  <div className={styles.envDetailRow}>
                    <span>Version:</span>
                    <strong>{selectedProject.environment?.version || "—"}</strong>
                  </div>
                  <div className={styles.envDetailRow}>
                    <span>Environment:</span>
                    <strong className={styles.envTypeBadge}>
                      {selectedProject.environment?.type || "—"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserDetailView;