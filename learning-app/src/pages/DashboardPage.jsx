import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/StarRating';
import { Icons } from '../components/Icons';
import { useNavigate } from 'react-router-dom';

/* ══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  'Programming', 'Design', 'Marketing', 'Web Development', 'Mobile Development',
  'Data Science', 'Business', 'Photography', 'Music', 'Other',
];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

const formatRoleLabel = (role) => {
  if (!role) return 'Learner';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDateLabel = (value) => {
  if (!value) return 'Recently joined';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getProfileStrength = (user) => {
  const completedFields = [user?.fullName, user?.bio, user?.profilePictureUrl].filter(Boolean).length;
  return Math.round((completedFields / 3) * 100);
};

const SectionHeader = ({ eyebrow, title, subtitle, actions }) => (
  <div className="dashboard-section-header">
    <div>
      {eyebrow && <div className="dashboard-section-eyebrow">{eyebrow}</div>}
      <h2 className="dashboard-section-title">{title}</h2>
      {subtitle && <p className="dashboard-section-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="dashboard-section-actions">{actions}</div>}
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   MODULE EDITOR — sub-component for managing a list of course modules
══════════════════════════════════════════════════════════════════════════════ */
const ModuleEditor = ({ modules, onChange }) => {
  const addModule = () => {
    onChange([...modules, { id: '', title: '', description: '', videoUrl: '', duration: '' }]);
  };

  const updateModule = (index, field, value) => {
    const updated = modules.map((m, i) => i === index ? { ...m, [field]: value } : m);
    onChange(updated);
  };

  const removeModule = (index) => {
    onChange(modules.filter((_, i) => i !== index));
  };

  const moveModule = (index, dir) => {
    const arr = [...modules];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    onChange(arr);
  };

  return (
    <div className="module-editor">
      <div className="module-editor-header">
        <label className="form-label" style={{ margin: 0 }}>Course Modules ({modules.length})</label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addModule}>
          <Icons.Plus size={14} />
          Add Module
        </button>
      </div>

      {modules.length === 0 && (
        <div className="module-empty-state">
          No modules yet. Add your first lesson block to build a strong curriculum.
        </div>
      )}

      {modules.map((mod, idx) => (
        <div key={idx} className="module-editor-item">
          <div className="module-editor-item-top">
            <span className="module-editor-number">{idx + 1}</span>
            <input
              className="form-input"
              type="text"
              placeholder="Module title *"
              value={mod.title}
              onChange={(e) => updateModule(idx, 'title', e.target.value)}
              style={{ flex: 1, padding: '10px 14px', fontSize: 14 }}
              id={`module-title-${idx}`}
            />
            <div className="module-editor-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveModule(idx, -1)} disabled={idx === 0} style={{ padding: '6px 8px' }}>Up</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveModule(idx, 1)} disabled={idx === modules.length - 1} style={{ padding: '6px 8px' }}>Down</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeModule(idx)} style={{ padding: '6px 8px' }}>
                <Icons.X size={14} />
              </button>
            </div>
          </div>
          <textarea
            className="form-input"
            placeholder="Module description (optional)"
            value={mod.description}
            onChange={(e) => updateModule(idx, 'description', e.target.value)}
            rows={2}
            style={{ fontSize: 13, padding: '10px 14px' }}
            id={`module-desc-${idx}`}
          />
          <div className="module-editor-grid">
            <input
              className="form-input"
              type="url"
              placeholder="Video URL (optional)"
              value={mod.videoUrl}
              onChange={(e) => updateModule(idx, 'videoUrl', e.target.value)}
              style={{ fontSize: 13, padding: '10px 14px' }}
              id={`module-video-${idx}`}
            />
            <input
              className="form-input"
              type="text"
              placeholder="Duration (e.g. 45 min)"
              value={mod.duration}
              onChange={(e) => updateModule(idx, 'duration', e.target.value)}
              style={{ fontSize: 13, padding: '10px 14px' }}
              id={`module-duration-${idx}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   CREATE / EDIT COURSE MODAL
══════════════════════════════════════════════════════════════════════════════ */
const CourseModal = ({ courseToEdit = null, onClose, onSaved }) => {
  const isEditing = !!courseToEdit;
  const [form, setForm] = useState({
    title: courseToEdit?.title || '',
    description: courseToEdit?.description || '',
    category: courseToEdit?.category || '',
    level: courseToEdit?.level || 'beginner',
    duration: courseToEdit?.duration || '',
    price: courseToEdit?.price || 'Free',
    thumbnail: courseToEdit?.thumbnail || '',
  });
  const [modules, setModules] = useState(courseToEdit?.modules || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Course title is required.'); return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }
    if (!form.category) { setError('Please select a category.'); return; }

    setLoading(true);
    try {
      const payload = { ...form, modules };
      let res;
      if (isEditing) {
        res = await api.put(`/courses/${courseToEdit.id}`, payload);
      } else {
        res = await api.post('/courses', payload);
      }
      onSaved(res.data.course);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-wide" style={{ maxHeight: '92vh' }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Edit Course' : 'Create New Course'}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <Icons.X size={16} />
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><Icons.AlertCircle size={16} /> {error}</div>}

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Basic Info */}
          <div className="dashboard-surface dashboard-surface-muted">
            <div className="modal-section-label">
              Course Details
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="course-title">Title *</label>
              <input id="course-title" className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Complete Python Bootcamp" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="course-desc">Description *</label>
              <textarea id="course-desc" className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="What will students learn? What makes this course unique?" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="course-thumbnail">Thumbnail URL</label>
              <input id="course-thumbnail" className="form-input" name="thumbnail" type="url" value={form.thumbnail} onChange={handleChange} placeholder="https://example.com/image.jpg" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="course-category">Category *</label>
                <select id="course-category" className="form-input" name="category" value={form.category} onChange={handleChange} style={{ cursor: 'pointer' }}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="course-level">Level</label>
                <select id="course-level" className="form-input" name="level" value={form.level} onChange={handleChange} style={{ cursor: 'pointer' }}>
                  {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="course-duration">Total Duration</label>
                <input id="course-duration" className="form-input" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g., 12 hours" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="course-price">Price</label>
                <input id="course-price" className="form-input" name="price" value={form.price} onChange={handleChange} placeholder="Free or $29.99" />
              </div>
            </div>
          </div>

          {/* Modules */}
          <div className="dashboard-surface dashboard-surface-muted">
            <div className="modal-section-label" style={{ marginBottom: 16 }}>
              Curriculum Modules
            </div>
            <ModuleEditor modules={modules} onChange={setModules} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button id="course-save-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm" /> Saving...</> : isEditing ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   PROFILE TAB
══════════════════════════════════════════════════════════════════════════════ */
const ProfileTab = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    profilePictureUrl: user?.profilePictureUrl || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setSuccess(''); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Full name cannot be empty.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/users/me', form);
      updateUser(res.data.user);
      setSuccess('Profile updated successfully! ✅');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally { setLoading(false); }
  };

  const initials = (user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div>
      <SectionHeader
        eyebrow="Profile"
        title="Personal Information"
        subtitle="Manage how your account appears across the platform and keep your public profile up to date."
      />
      <div className="dashboard-card-grid">
        <div className="profile-form-card">
          <div className="profile-picture-preview">
            <div className="profile-picture-frame">
          {form.profilePictureUrl ? (
            <img src={form.profilePictureUrl} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="profile-picture-placeholder">{initials}</div>
          )}
            </div>
          <div>
            <div className="dashboard-inline-title">Profile Picture</div>
            <div className="dashboard-inline-copy">
              Paste a public image URL to update your avatar.
            </div>
          </div>
        </div>
        {success && <div className="alert alert-success" style={{ marginBottom: 20 }}><Icons.CheckCircle size={16} /> {success}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><Icons.AlertCircle size={16} /> {error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-fullName">Full Name</label>
            <input id="profile-fullName" className="form-input" type="text" name="fullName" value={form.fullName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email cannot be changed</span>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-bio">Bio</label>
            <textarea id="profile-bio" className="form-input" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about yourself..." rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-pic-url">Profile Picture URL</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Image size={16} /></span>
              <input id="profile-pic-url" className="form-input" type="url" name="profilePictureUrl" value={form.profilePictureUrl} onChange={handleChange} placeholder="https://example.com/photo.jpg" />
            </div>
          </div>
          <button id="save-profile-btn" type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? <><span className="spinner spinner-sm" /> Saving...</> : <><Icons.Check size={16} /> Save Changes</>}
          </button>
        </form>
        </div>
      <div className="profile-form-card">
        <div className="dashboard-card-heading">
          <h3>Account Details</h3>
          <span className="badge badge-neutral">Read only</span>
        </div>
        {[
          { label: 'Username', value: `@${user?.username}` },
          { label: 'Email', value: user?.email },
          { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
          { label: 'Role', value: formatRoleLabel(user?.role) },
        ].map(({ label, value }) => (
          <div key={label} className="account-info-row">
            <span className="account-info-label">{label}</span>
            <span className="account-info-value">{value}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   SECURITY TAB
══════════════════════════════════════════════════════════════════════════════ */
const SecurityTab = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setSuccess(''); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) { setError('Enter your current password.'); return; }
    if (form.newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/users/me/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess(res.data.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Security"
        title="Security Settings"
        subtitle="Keep your account protected with a strong password and regular updates."
      />
      <div className="profile-form-card">
        <div className="dashboard-info-banner">
          <div className="dashboard-info-banner-icon">
            <Icons.Shield size={18} />
          </div>
          <div>
            <div className="dashboard-inline-title">Change Password</div>
            <div className="dashboard-inline-copy">
              You must verify your current password before setting a new one.
            </div>
          </div>
        </div>
        {success && <div className="alert alert-success" style={{ marginBottom: 20 }}><Icons.CheckCircle size={16} /> {success}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><Icons.AlertCircle size={16} /> {error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="security-current">Current Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Lock size={16} /></span>
              <input id="security-current" className="form-input" type={showCurrent ? 'text' : 'password'} name="currentPassword" value={form.currentPassword} onChange={handleChange} placeholder="Your current password" />
              <button type="button" className="input-action" onClick={() => setShowCurrent(!showCurrent)} tabIndex={-1}>
                {showCurrent ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="dashboard-divider" />
          <div className="form-group">
            <label className="form-label" htmlFor="security-new">New Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Key size={16} /></span>
              <input id="security-new" className="form-input" type={showNew ? 'text' : 'password'} name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="Min. 8 characters" />
              <button type="button" className="input-action" onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                {showNew ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="security-confirm">Confirm New Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Key size={16} /></span>
              <input id="security-confirm" className={`form-input ${form.confirmPassword && form.newPassword !== form.confirmPassword ? 'error' : ''}`} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" />
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <div className="form-error"><Icons.AlertCircle size={14} /> Passwords do not match</div>
            )}
          </div>
          <button id="change-password-btn" type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? <><span className="spinner spinner-sm" /> Updating...</> : <><Icons.Shield size={16} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MY COURSES TAB (instructor view)
══════════════════════════════════════════════════════════════════════════════ */
const MyCoursesTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data.courses.filter(c => c.instructorId === user?.id));
    } catch {
      setError('Failed to load your courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []); // eslint-disable-line

  const handleSaved = (savedCourse) => {
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === savedCourse.id ? savedCourse : c));
    } else {
      setCourses(prev => [savedCourse, ...prev]);
    }
    setEditingCourse(null);
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/courses/${id}`);
      setCourses(prev => prev.filter(c => c.id !== id));
      setDeleteId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreate = () => { setEditingCourse(null); setShowModal(true); };
  const openEdit = (course) => {
    api.get(`/courses/${course.id}`).then(res => {
      setEditingCourse(res.data.course);
      setShowModal(true);
    });
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderTopColor: 'var(--brand-1)' }} /></div>;
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Teaching"
        title="My Courses"
        subtitle="Create, refine, and monitor your courses from one clean workspace."
        actions={(
          <button id="create-course-btn" className="btn btn-primary" onClick={openCreate}>
            <Icons.Plus size={16} />
            Create Course
          </button>
        )}
      />

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><Icons.AlertCircle size={16} /> {error}</div>}

      {courses.length === 0 ? (
        <div className="empty-state dashboard-empty-state">
          <div className="empty-state-icon"><Icons.BookOpen size={26} /></div>
          <h3>No courses yet</h3>
          <p>Share your expertise by publishing your first course with a clear title, structured modules, and a strong thumbnail.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={openCreate}>
            <Icons.Plus size={16} />
            Create Your First Course
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {courses.map(course => (
            <div key={course.id} className="my-course-row">
              <div className="my-course-row-main">
                <div className="my-course-thumb">
                  {course.thumbnail ? <img src={course.thumbnail} alt={course.title} /> : <Icons.BookOpen size={22} />}
                </div>

                <div className="my-course-info">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                    <div className="my-course-title">{course.title}</div>
                    <span className="badge badge-primary">{course.level}</span>
                  </div>
                  <div className="my-course-stats">
                    <span className="my-course-stat"><Icons.Tag size={13} /> {course.category}</span>
                    <span className="my-course-stat"><Icons.DollarSign size={13} /> {course.price}</span>
                    <span className="my-course-stat"><Icons.Users size={13} /> {course.enrolledCount} enrolled</span>
                    {course.rating > 0 && <span className="my-course-stat"><Icons.Star size={13} /> {course.rating}</span>}
                    {course.modules && <span className="my-course-stat"><Icons.Layers size={13} /> {course.modules.length || 0} modules</span>}
                  </div>
                </div>

                <div className="my-course-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/courses/${course.id}`)} id={`view-course-${course.id}`}>
                    <Icons.ArrowRight size={14} />
                    View
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(course)} id={`edit-course-${course.id}`}>
                    <Icons.Edit size={14} />
                    Edit
                  </button>
                  {deleteId === course.id ? (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id)} disabled={deleteLoading} id={`confirm-delete-${course.id}`}>
                        {deleteLoading ? <span className="spinner spinner-sm" /> : <><Icons.Trash size={14} /> Confirm</>}
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(course.id)} id={`delete-course-${course.id}`}>
                      <Icons.Trash size={14} />
                    </button>
                  )}
                </div>
              </div>

              {course.modules && course.modules.length > 0 && (
                <div className="my-course-modules">
                  {course.modules.slice(0, 4).map((m, i) => (
                    <span key={i} className="module-pill">
                      {i + 1}. {m.title}
                    </span>
                  ))}
                  {course.modules.length > 4 && (
                    <span className="badge badge-neutral">
                      +{course.modules.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CourseModal
          courseToEdit={editingCourse}
          onClose={() => { setShowModal(false); setEditingCourse(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   ENROLLED COURSES TAB (student view)
══════════════════════════════════════════════════════════════════════════════ */
const EnrolledCoursesTab = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses/enrolled/me')
      .then(res => setCourses(res.data.courses))
      .catch(() => setError('Failed to load enrolled courses.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderTopColor: 'var(--brand-1)' }} /></div>;

  return (
    <div>
      <SectionHeader
        eyebrow="Learning"
        title="Enrolled Courses"
        subtitle="Jump back into your current courses and keep your progress moving."
      />
      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><Icons.AlertCircle size={16} /> {error}</div>}
      {courses.length === 0 ? (
        <div className="empty-state dashboard-empty-state">
          <div className="empty-state-icon"><Icons.Compass size={26} /></div>
          <h3>No enrollments yet</h3>
          <p>Browse the course catalog, find a topic you love, and start learning with a structured path.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/courses')}>
            <Icons.Compass size={16} />
            Browse Courses
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {courses.map(course => (
            <div
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="enrolled-row"
              id={`enrolled-course-${course.id}`}
            >
              <div className="enrolled-thumb">
                {course.thumbnail ? <img src={course.thumbnail} alt={course.title} /> : <Icons.BookOpen size={18} />}
              </div>
              <div className="enrolled-info">
                <div className="enrolled-title">{course.title}</div>
                <div className="enrolled-meta">
                  by {course.instructorName} • {course.category}
                  {course.enrolledAt && ` • Enrolled ${new Date(course.enrolledAt).toLocaleDateString()}`}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <StarRating rating={course.rating} size={12} />
                <span className="enrolled-badge">
                  <Icons.CheckCircle size={12} />
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'profile', label: 'Profile', Icon: Icons.User, description: 'Update your personal details and public profile.' },
  { id: 'security', label: 'Security', Icon: Icons.Shield, description: 'Protect your account with strong credentials.' },
  { id: 'my-courses', label: 'My Courses', Icon: Icons.BookOpen, description: 'Create and manage the courses you teach.' },
  { id: 'enrolled', label: 'Enrolled', Icon: Icons.GraduationCap, description: 'Continue the courses you are currently taking.' },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const initials = (user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase();
  const firstName = (user?.fullName || user?.username || 'there').split(' ')[0];
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const profileStrength = getProfileStrength(user);
  const overviewCards = [
    { label: 'Role', value: formatRoleLabel(user?.role), Icon: Icons.Award },
    { label: 'Member Since', value: formatDateLabel(user?.createdAt), Icon: Icons.Clock },
    { label: 'Profile Strength', value: `${profileStrength}%`, Icon: Icons.TrendingUp },
    { label: 'Current Focus', value: activeTabMeta.label, Icon: activeTabMeta.Icon },
  ];

  return (
    <div className="page-wrapper dashboard-page">
      <div className="container">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="dashboard-sidebar-card">
              <div className="sidebar-user-info">
                <div className="sidebar-avatar">
                  {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="avatar" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : initials}
                </div>
                <div className="sidebar-name">{user?.fullName || user?.username}</div>
                <div className="sidebar-username">@{user?.username}</div>
                <div className="sidebar-role-badge">{formatRoleLabel(user?.role)}</div>
                {user?.bio && <p className="sidebar-bio">{user.bio}</p>}
              </div>

              <nav className="sidebar-nav">
                {TABS.map((tab) => {
                  const TabIcon = tab.Icon;
                  return (
                    <button
                      key={tab.id}
                      className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                      id={`dashboard-tab-${tab.id}`}
                    >
                      <span className="nav-icon"><TabIcon size={16} /></span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="dashboard-sidebar-help">
              <div className="dashboard-sidebar-help-title">Workspace Tips</div>
              <p>Keep your profile complete, update your password regularly, and organize your courses with clear modules.</p>
            </div>
          </aside>

          <div className="dashboard-main">
            <section className="dashboard-hero">
              <div className="dashboard-hero-copy">
                <div className="dashboard-kicker">
                  <Icons.Grid size={14} />
                  Personal Workspace
                </div>
                <h1>Welcome back, {firstName}.</h1>
                <p>{activeTabMeta.description}</p>
                <div className="dashboard-hero-actions">
                  <button className="btn btn-primary" onClick={() => setActiveTab('profile')}>
                    <Icons.User size={16} />
                    Edit Profile
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('my-courses')}>
                    <Icons.BookOpen size={16} />
                    Manage Courses
                  </button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('security')}>
                    <Icons.Shield size={16} />
                    Security
                  </button>
                </div>
              </div>

              <div className="dashboard-overview-grid">
                {overviewCards.map(({ label, value, Icon }) => (
                  <div key={label} className="dashboard-overview-card">
                    <div className="dashboard-overview-icon">
                      <Icon size={18} />
                    </div>
                    <div className="dashboard-overview-label">{label}</div>
                    <div className="dashboard-overview-value">{value}</div>
                  </div>
                ))}
              </div>
            </section>

            <main className="dashboard-content">
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'my-courses' && <MyCoursesTab />}
              {activeTab === 'enrolled' && <EnrolledCoursesTab />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
