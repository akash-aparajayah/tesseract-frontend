// components/Breadcrumb.tsx
import { Link, useLocation } from "react-router-dom";
import {
  SquareDashedKanbanIcon,
  FolderKanban,
  PlusCircle,
  Briefcase,
  Users,
  UserPlus,
  FileText,
  BookOpen,
  Key,
  Settings,
  Eye,
  Edit,
  User,
  Server,
} from "lucide-react";
import styles from "../componentStyles/Breadcrumb.module.css";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

// Helper to get icon based on label (used only for the page title)
const getIconForTitle = (label: string): React.ReactNode => {
  const labelLower = label.toLowerCase();
  const iconSize = 22;
  const iconProps = { size: iconSize, className: styles.titleIcon };

  if (labelLower === "dashboard") return <SquareDashedKanbanIcon {...iconProps} />;
  if (labelLower === "project dashboard")
    return <FolderKanban {...iconProps} />;
  if (labelLower === "create project") return <PlusCircle {...iconProps} />;
  if (labelLower === "workspace") return <Briefcase {...iconProps} />;
  if (labelLower === "user hub") return <Users {...iconProps} />;
  if (labelLower === "create user") return <UserPlus {...iconProps} />;
  if (labelLower === "report") return <FileText {...iconProps} />;
  if (labelLower === "documentation") return <BookOpen {...iconProps} />;
  if (labelLower === "token generate") return <Key {...iconProps} />;
  if (labelLower === "provider config") return <Settings {...iconProps} />;
  if (labelLower === "view project") return <Eye {...iconProps} />;
  if (labelLower === "edit project") return <Edit {...iconProps} />;
  if (labelLower === "user details") return <User {...iconProps} />;
  if (labelLower === "environment") return <Server {...iconProps} />;
  if (labelLower === "profile settings") return <User {...iconProps} />;
  return null;

};

export default function Breadcrumb() {
  const location = useLocation();

  const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
    "/dashboard": [{ label: "Dashboard" }],
    "/dashboard/project": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Project Dashboard" },
    ],
    "/dashboard/project-create": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Project Dashboard", path: "/dashboard/project" },
      { label: "Create Project" },
    ],
    "/profile": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Profile Settings" },
    ],
    "/dashboard/workspace": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Workspace" },
    ],
    "/dashboard/admin": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "User Hub" },
    ],
    "/dashboard/admin-create": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "User Hub", path: "/dashboard/admin" },
      { label: "Create User" },
    ],
    "/dashboard/report": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Report" },
    ],
    "/dashboard/documentation": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Documentation" },
    ],
    "/dashboard/token-generate": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Token Generate" },
    ],
    "/dashboard/provider-config": [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Provider Config" },
    ],
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    // Handle profile page with query parameters
    if (location.pathname.startsWith("/dashboard/profile")) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Profile Settings" },
      ];
    }

    if (breadcrumbMap[location.pathname]) {
      return breadcrumbMap[location.pathname];
    }

    if (
      location.pathname.includes("/project/") &&
      location.pathname.includes("/view")
    ) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Project Dashboard", path: "/dashboard/project" },
        { label: "View Project" },
      ];
    }

    if (location.pathname.includes("/project-edit/")) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Project Dashboard", path: "/dashboard/project" },
        { label: "Edit Project" },
      ];
    }

    if (location.pathname.includes("/project-edit-basic/")) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Project Dashboard", path: "/dashboard/project" },
        { label: "Edit Project" },
      ];
    }

    if (location.pathname.includes("/user/")) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "User Hub", path: "/dashboard/admin" },
        { label: "User Details" },
      ];
    }

    if (location.pathname.includes("/provider-config/")) {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Provider Config", path: "/dashboard/provider-config" },
        { label: "Environment" },
      ];
    }

    return [];
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : "";

  if (breadcrumbs.length === 0) return null;

  return (
    <div className={styles.breadcrumbWrapper}>
      <h1 className={styles.pageTitle}>
        {getIconForTitle(pageTitle)}
        <span>{pageTitle}</span>
      </h1>
      <nav className={styles.breadcrumb}>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className={styles.breadcrumbItem}>
            {index > 0 && <span className={styles.separator}>/</span>}
            {crumb.path ? (
              <Link to={crumb.path} className={styles.breadcrumbLink}>
                {crumb.label}
              </Link>
            ) : (
              <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
