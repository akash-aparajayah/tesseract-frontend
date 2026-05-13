import React, { useState, useEffect, useMemo } from 'react';
import '../styles/AdminPanel.css';                     // your new CSS file
import { useToast } from '../hooks/useToast';
import { getAllAdminApi, activateOrDeactivateAdminApi, createAdminApi, changePasswordApi } from '../services/adminApi';
import Loader from '@/components/common/Loader';
import noDataIllustration from '../assets/No data-cuate.svg';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  joined: string;
  active: boolean;
}

const AdminPanel: React.FC = () => {
  const { showToast, ToastContainer } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Admin' });
  const [creating, setCreating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllAdminApi();
      setUsers(response.data);
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (statusFilter !== 'all') {
      result = result.filter(user => user.active === (statusFilter === 'active'));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    }
    return result;
  }, [users, searchTerm, statusFilter]);

  const totalAdmins = users.length;
  const activeAdmins = users.filter(u => u.active).length;
  const inactiveAdmins = totalAdmins - activeAdmins;

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await activateOrDeactivateAdminApi(id, newStatus);
      setUsers(prev => prev.map(user => user.id === id ? { ...user, active: newStatus } : user));
      showToast(`User ${newStatus ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
      fetchUsers();
    }
  };

  const handleCreate = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast('Please fill all fields', 'error');
      return;
    }
    if (newUser.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      setCreating(true);
      const response = await createAdminApi(newUser.name, newUser.email, newUser.password, newUser.role);
      setUsers([...users, response.data]);
      setNewUser({ name: '', email: '', password: '', role: 'Admin' });
      setShowModal(false);
      showToast('Admin created successfully', 'success');
    } catch (error) {
      showToast('Failed to create admin', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Both fields required');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (!selectedUser) return;
    try {
      setUpdatingPassword(true);
      await changePasswordApi(selectedUser.id, passwordData.newPassword);
      showToast(`Password changed for ${selectedUser.name}`, 'success');
      setShowPasswordModal(false);
      setSelectedUser(null);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (error) {
      showToast('Failed to change password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <ToastContainer />
      <div className="admin-panel">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title-section">
            <h1>Admin Control Panel</h1>
            <p>Manage administrators, roles and system access</p>
          </div>
		  <div>
          <button className="btn-add-admin" onClick={() => setShowModal(true)}>
            + Add Admin
          </button>
		  </div>
        </div>

        {/* Stats Row */}
        <div className="stats-grid-admin">
          <div className="stat-card-admin">
            <div className="stat-icon-admin">👥</div>
            <div className="stat-info-admin">
              <span className="stat-label-admin">Total Admins</span>
              <span className="stat-value-admin">{totalAdmins}</span>
            </div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-icon-admin success">✅</div>
            <div className="stat-info-admin">
              <span className="stat-label-admin">Active</span>
              <span className="stat-value-admin">{activeAdmins}</span>
            </div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-icon-admin danger">⛔</div>
            <div className="stat-info-admin">
              <span className="stat-label-admin">Inactive</span>
              <span className="stat-value-admin">{inactiveAdmins}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="admin-controls">
          <div className="search-field">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {filteredUsers.length === 0 ? (
            <div className="empty-table-state">
              <img src={noDataIllustration} alt="No admins" />
              <p>No admins found</p>
            </div>
          ) : (
            <table className="admin-table-modern">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Admin</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id} className={!user.active ? 'inactive-row' : ''}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="admin-info">
                        <div className="admin-avatar">{user.name.charAt(0)}</div>
                        <div>
                          <div className="admin-name">{user.name}</div>
                          <div className="admin-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-pill ${user.role === 'Super Admin' ? 'super' : user.role === 'Manager' ? 'manager' : 'admin'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${user.active ? 'active' : 'inactive'}`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{user.joined}</td>
                    <td className="action-cell">
                      <button
                        className="action-icon password"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordModal(true);
                        }}
                        title="Change password"
                      >
                        🔑
                      </button>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={user.active}
                          onChange={() => toggleActive(user.id, user.active)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Admin Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Create admin</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-card-body">
              <div className="input-group">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Role</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option>Admin</option>
                  <option>Super Admin</option>
                  <option>Manager</option>
                </select>
              </div>
            </div>
            <div className="modal-card-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card-header">
              <h3>Change password</h3>
              <button className="close-modal" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div className="modal-card-body">
              <p className="modal-subtext">For <strong>{selectedUser.name}</strong></p>
              <div className="input-group">
                <label>New password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Confirm password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              {passwordError && <div className="error-text">{passwordError}</div>}
            </div>
            <div className="modal-card-footer">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handlePasswordChange} disabled={updatingPassword}>
                {updatingPassword ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;