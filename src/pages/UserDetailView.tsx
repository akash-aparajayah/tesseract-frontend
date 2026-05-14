// src/pages/admin/UserDetailView.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import styles from "../styles/userDetail.module.css";
import {
  ArrowLeft,
  Mail,
  Shield,
  Power,
  Briefcase,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  User as UserIcon,
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
}

// Mock projects
const MOCK_ASSIGNED_PROJECTS: Project[] = [
  { id: "1", name: "E-Commerce Platform", description: "Frontend + Backend integration" },
  { id: "2", name: "Mobile App", description: "React Native cross-platform" },
];
const MOCK_AVAILABLE_PROJECTS: Project[] = [
  { id: "3", name: "AI Chatbot", description: "OpenAI integration" },
  { id: "4", name: "Analytics Dashboard", description: "Real-time data visualization" },
];

const UserDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
        setAvailableProjects(MOCK_AVAILABLE_PROJECTS);
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
          setAvailableProjects(MOCK_AVAILABLE_PROJECTS);
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

  const handleAssignProject = async () => {
    if (!selectedProjectId) return;
    setAssigning(true);
    setSuccessMessage("");
    setTimeout(() => {
      const project = availableProjects.find(p => p.id === selectedProjectId);
      if (project) {
        setAssignedProjects(prev => [...prev, project]);
        setAvailableProjects(prev => prev.filter(p => p.id !== selectedProjectId));
        setSelectedProjectId("");
        setSuccessMessage("Project assigned!");
        setTimeout(() => setSuccessMessage(""), 2000);
      }
      setAssigning(false);
    }, 500);
  };

  const handleRemoveProject = (projectId: string) => {
    if (!window.confirm("Remove this project?")) return;
    const project = assignedProjects.find(p => p.id === projectId);
    if (project) {
      setAssignedProjects(prev => prev.filter(p => p.id !== projectId));
      setAvailableProjects(prev => [...prev, project]);
    }
  };

  const getRoleDisplay = () => {
    switch (user?.role) {
      case "SUPER_ADMIN": return "Super Admin";
      case "ADMIN": return "Admin";
      default: return "User";
    }
  };

  if (loading) return <Loader />;
  if (error || !user) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} />
        <h3>Error loading user</h3>
        <p>{error || "User not found"}</p>
        <button onClick={() => navigate("/dashboard/admin")} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Admin Panel
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link to="/dashboard/admin">Admin</Link>
        <span>/</span>
        <Link to="/dashboard/admin">Users</Link>
        <span>/</span>
        <span className={styles.current}>{user.name}</span>
      </div>

      {/* Hero Banner with User Info */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1>View User</h1>
          <div className={styles.badgeRow}>
            <span className={styles.userBadge}>#{user.id.slice(0, 8)}</span>
            <span className={`${styles.statusPill} ${user.active ? styles.statusActive : styles.statusInactive}`}>
              {user.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className={styles.userInfoInline}>
            <div className={styles.infoRow}>
              <UserIcon size={16} />
              <span>{user.name}</span>
            </div>
            <div className={styles.infoRow}>
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
            <div className={styles.infoRow}>
              <Shield size={16} />
              <span>Role: {getRoleDisplay()}</span>
            </div>
          </div>
        </div>
        <div className={styles.userAvatarLarge}>
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Assigned Projects Section (only this remains) */}
      <div className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <h3><Briefcase size={18} /> Assigned Projects</h3>
          <div className={styles.assignBox}>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={assigning || availableProjects.length === 0}
            >
              <option value="">Select a project...</option>
              {availableProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={handleAssignProject} disabled={!selectedProjectId || assigning} className={styles.assignBtn}>
              <Plus size={16} /> Assign
            </button>
          </div>
        </div>

        {successMessage && (
          <div className={styles.successMsg}>
            <CheckCircle size={16} /> {successMessage}
          </div>
        )}

        {assignedProjects.length === 0 ? (
          <div className={styles.noProjects}>
            <p>No projects assigned yet.</p>
          </div>
        ) : (
          <div className={styles.projectList}>
            {assignedProjects.map(project => (
              <div key={project.id} className={styles.projectCard}>
                <div className={styles.projectInfo}>
                  <strong>{project.name}</strong>
                  {project.description && <p>{project.description}</p>}
                </div>
                <button onClick={() => handleRemoveProject(project.id)} className={styles.removeBtn}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailView;