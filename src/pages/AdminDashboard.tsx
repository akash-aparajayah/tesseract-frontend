import React, { useState, useMemo, useEffect } from "react";
import styles from "../styles/adminPanel.module.css";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  UserPlus,
  Settings,
  Pencil,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import noDataImg from "../assets/No data-cuate.svg";
import Loader from "@/components/common/Loader";

interface Admin {
  id: number;
  name: string;
  email: string;
  role: "admin" | "super_admin" | "viewer";
  status: "Active" | "Inactive";
}

const INITIAL_ADMINS: Admin[] = [
  { id: 1, name: "testing", email: "testing@aparajayah.com", role: "admin", status: "Active" },
  { id: 2, name: "akash", email: "akash@aparajayah.com", role: "super_admin", status: "Active" },
  { id: 3, name: "demo_inactive", email: "demo@aparajayah.com", role: "viewer", status: "Inactive" },
  { id: 4, name: "srinivasan", email: "srinivasan@aparajayah.com", role: "admin", status: "Active" },
  { id: 5, name: "priya", email: "priya@aparajayah.com", role: "viewer", status: "Inactive" },
  { id: 6, name: "vikram", email: "vikram@aparajayah.com", role: "super_admin", status: "Active" },
  { id: 7, name: "divya", email: "divya@aparajayah.com", role: "admin", status: "Active" },
];

const getInitials = (name: string) => name.charAt(0).toUpperCase();

const AdminPanel: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>(INITIAL_ADMINS);
   const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "super_admin" | "viewer">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const totalCount = admins.length;
  const activeCount = admins.filter((a) => a.status === "Active").length;
  const inactiveCount = totalCount - activeCount;

  const filteredAdmins = useMemo(() => {
    let filtered = [...admins];
    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter((a) => a.role === roleFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    return filtered;
  }, [admins, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAdmins.slice(start, start + rowsPerPage);
  }, [filteredAdmins, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
      setLoading(true);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleToggleStatus = (id: number) => {
    setAdmins((prev) =>
      prev.map((admin) =>
        admin.id === id
          ? { ...admin, status: admin.status === "Active" ? "Inactive" : "Active" }
          : admin
      )
    );
  };

  const handleView = (admin: Admin) => {
    alert(`View Admin\nName: ${admin.name}\nEmail: ${admin.email}\nRole: ${admin.role}\nStatus: ${admin.status}`);
  };

  const handleEdit = (admin: Admin) => {
    alert(`Edit Admin: ${admin.name} (open modal in production)`);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Permanently delete this admin?")) {
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      if (currentPage > Math.ceil((filteredAdmins.length - 1) / rowsPerPage) && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return styles.roleAdmin;
      case "super_admin":
        return styles.roleSuper;
      default:
        return styles.roleUser;
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "super_admin":
        return "Super Admin";
      default:
        return "Viewer";
    }
  };

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
    if (loading) {
    // return <Loader />;
  }


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Control Panel</h1>
        {/* <p>Manage administrators, roles and permissions</p> */}
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cardTotal}`}>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Total Admins</div>
            <div className={styles.statNumber}>{totalCount}</div>
          </div>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.cardActive}`}>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Active</div>
            <div className={styles.statNumber}>{activeCount}</div>
          </div>
          <div className={styles.statIcon}>
            <UserCheck size={24} />
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.cardInactive}`}>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Inactive</div>
            <div className={styles.statNumber}>{inactiveCount}</div>
          </div>
          <div className={styles.statIcon}>
            <UserX size={24} />
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.actionsGroup}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className={styles.roleSelect}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className={styles.roleSelect}
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button className={styles.addBtn} onClick={() => alert("Add Admin form")}>
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colNo}>S.NO</th>
              <th className={styles.colUser}>User</th>
              <th className={styles.colEmail}>Email</th>
              <th className={styles.colRole}>Role</th>
              <th className={styles.colStatus}>Status</th>
              <th className={styles.colActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAdmins.map((admin, idx) => {
              const globalIndex = (currentPage - 1) * rowsPerPage + idx + 1;
              const isActive = admin.status === "Active";
              const initials = getInitials(admin.name);
              return (
                <tr key={admin.id}>
                  <td className={styles.colNo}>{globalIndex}</td>
                  <td className={styles.colUser}>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>{initials}</div>
                      <span className={styles.userName}>{admin.name}</span>
                    </div>
                  </td>
                  <td className={styles.colEmail}>
                    <span className={styles.userEmail}>{admin.email}</span>
                  </td>
                  <td className={styles.colRole}>
                    <span className={`${styles.roleBadge} ${getRoleBadge(admin.role)}`}>
                      {getRoleDisplay(admin.role)}
                    </span>
                  </td>
                  <td className={styles.colStatus}>
                    <div className={styles.statusCell}>
                      <div
                        className={`${styles.toggle} ${isActive ? styles.active : ""}`}
                        onClick={() => handleToggleStatus(admin.id)}
                      >
                        <div className={styles.knob}></div>
                      </div>
                      <span
                        className={`${styles.statusText} ${
                          isActive ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {admin.status}
                      </span>
                    </div>
                  </td>
                  <td className={styles.colActions}>
                    <div className={styles.actionMenu}>
                      <button className={styles.dotsBtn}>
                        <Settings size={16} />
                      </button>
                      <div className={styles.dropdown}>
                        <button onClick={() => handleView(admin)}>
                          <Eye size={14} /> View
                        </button>
                        <button onClick={() => handleEdit(admin)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(admin.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginatedAdmins.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.noData}>
                   <img src={noDataImg} alt="No data" className={styles.noDataImg} />
                    <div>No User found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`${styles.pageBtn} ${
                currentPage === page ? styles.activePage : ""
              }`}
              onClick={() => changePage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className={styles.pageBtn}
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight size={14} />
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;