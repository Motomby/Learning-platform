import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { StarRating, StarPicker } from '../components/StarRating';
import { Icons } from '../components/Icons';

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
const EMOJI_MAP = {
  Programming: '', Design: '', Marketing: '',
  'Web Development': '', 'Mobile Development': '', 'Data Science': '',
  Business: '', Photography: '', Music: '', Other: '',
};
const LEVEL_COLOR = {
  beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-primary',
};

/* ══════════════════════════════════════════════════════════════════
   MODULE LIST
══════════════════════════════════════════════════════════════════ */
const ModuleList = ({ modules = [] }) => {
  const [open, setOpen] = useState(null);
  if (!modules.length) return null;

  return (
    <div className="curriculum-section">
      <div className="curriculum-header">
        <h2 className="curriculum-title">Course Curriculum</h2>
        <span className="curriculum-count">
          {modules.length} module{modules.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {modules.map((mod, idx) => (
          <div key={mod.id || idx} className={`module-item ${open === idx ? 'open' : ''}`}>
            {/* Module header */}
            <button
              type="button"
              className="module-btn"
              onClick={() => setOpen(open === idx ? null : idx)}
              id={`module-toggle-${idx}`}
            >
              <span className="module-number">{idx + 1}</span>
              <div className="module-info">
                <div className="module-title">{mod.title}</div>
                {mod.duration && (
                  <div className="module-duration">⏱ {mod.duration}</div>
                )}
              </div>
              <span className="module-chevron">›</span>
            </button>

            {/* Module body */}
            {open === idx && (mod.description || mod.videoUrl) && (
              <div className="module-body">
                {mod.description && (
                  <p className="module-desc">{mod.description}</p>
                )}
                {mod.videoUrl && (
                  <a
                    href={mod.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    ▶ Watch Video
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   REVIEW CARD
══════════════════════════════════════════════════════════════════ */
const ReviewCard = ({ review }) => {
  const initials = (review.username || 'U').slice(0, 2).toUpperCase();
  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-avatar">
          {initials}
        </div>
        <div className="review-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="review-username">@{review.username}</span>
            <StarRating rating={review.rating} size={13} showNumber={false} />
            <span className="review-date">
              {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
      <p className="review-comment">
        {review.comment}
      </p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   REVIEW FORM
══════════════════════════════════════════════════════════════════ */
const ReviewForm = ({ courseId, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Please select a star rating.'); return; }
    if (comment.trim().length < 5) { setError('Comment must be at least 5 characters.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post(`/courses/${courseId}/reviews`, { rating, comment });
      setSuccess('Review submitted! Thank you. 🎉');
      onSubmitted(res.data.review);
      setRating(0);
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally { setLoading(false); }
  };

  return (
    <div className="review-form-card">
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>✍️ Write a Review</h3>
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><Icons.AlertCircle size={16} /> {error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Your Rating *</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="review-comment">Your Review *</label>
          <textarea
            id="review-comment"
            className="form-input"
            value={comment}
            onChange={(e) => { setComment(e.target.value); setError(''); }}
            placeholder="Share your honest experience with this course..."
            rows={4}
          />
        </div>
        <button id="submit-review-btn" type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? <><span className="spinner spinner-sm" /> Submitting...</> : '📤 Submit Review'}
        </button>
      </form>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ENROLL BUTTON SECTION
══════════════════════════════════════════════════════════════════ */
const EnrollSection = ({ course, isOwner }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated || isOwner) { setChecking(false); return; }
    api.get(`/courses/${course.id}/enrollment-status`)
      .then(res => setEnrolled(res.data.enrolled))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [course.id, isAuthenticated, isOwner]);

  const handleEnroll = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post(`/courses/${course.id}/enroll`);
      setEnrolled(true);
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed.');
    } finally { setLoading(false); }
  };

  if (isOwner) {
    return (
      <div className="alert alert-info" style={{ textAlign: 'center' }}>
        <span></span> You are the instructor of this course
      </div>
    );
  }

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, color: 'var(--text-muted)' }}>
        <span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--primary)' }} />
        Checking enrollment...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}><span>⚠️</span> {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>}

      {enrolled ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="alert alert-success" style={{ textAlign: 'center' }}>
            <span></span> You are enrolled in this course!
          </div>
          <button className="btn btn-primary btn-full" disabled>
            ▶ Start Learning (coming soon)
          </button>
        </div>
      ) : (
        <button
          id="enroll-btn"
          className="btn btn-primary btn-full btn-lg"
          onClick={handleEnroll}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner" /> Enrolling...</>
            : isAuthenticated
              ? '🚀 Enroll Now'
              : '🚀 Sign Up to Enroll'
          }
        </button>
      )}

      {!isAuthenticated && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
          <Link to="/login">Log in</Link> or <Link to="/register">create an account</Link> to enroll.
        </p>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   EDIT COURSE MODAL (owner only)
══════════════════════════════════════════════════════════════════ */
const CATEGORIES = ['Programming', 'Design', 'Marketing', 'Web Development', 'Mobile Development', 'Data Science', 'Business', 'Photography', 'Music', 'Other'];
const LEVELS_LIST = ['beginner', 'intermediate', 'advanced'];

const EditCourseModal = ({ course, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    title: course.title, description: course.description,
    category: course.category, level: course.level,
    duration: course.duration || '', price: course.price || 'Free', thumbnail: course.thumbnail || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/courses/${course.id}`, { ...form, modules: course.modules || [] });
      onUpdated(res.data.course);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">✏️ Edit Course</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><span>⚠️</span> {error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-title">Title</label>
            <input id="edit-title" className="form-input" name="title" value={form.title} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-desc">Description</label>
            <textarea id="edit-desc" className="form-input" name="description" value={form.description} onChange={handleChange} rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-thumbnail">Thumbnail URL</label>
            <input id="edit-thumbnail" className="form-input" name="thumbnail" type="url" value={form.thumbnail} onChange={handleChange} placeholder="https://..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-category">Category</label>
              <select id="edit-category" className="form-input" name="category" value={form.category} onChange={handleChange} style={{ cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-level">Level</label>
              <select id="edit-level" className="form-input" name="level" value={form.level} onChange={handleChange} style={{ cursor: 'pointer' }}>
                {LEVELS_LIST.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-duration">Duration</label>
              <input id="edit-duration" className="form-input" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g., 12 hours" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-price">Price</label>
              <input id="edit-price" className="form-input" name="price" value={form.price} onChange={handleChange} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 14px', background: 'rgba(108,99,255,0.07)', borderRadius: 'var(--radius-sm)' }}>
            💡 To edit modules, use the full editor in your Dashboard → My Courses.
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button id="edit-course-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   COURSE DETAIL PAGE
══════════════════════════════════════════════════════════════════ */
const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const isOwner = isAuthenticated && user?.id === course?.instructorId;

  // Load course + reviews
  const fetchData = useCallback(async () => {
    try {
      const [courseRes, reviewsRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/courses/${id}/reviews`),
      ]);
      setCourse(courseRes.data.course);
      setReviews(reviewsRes.data.reviews);

      // Check if current user already reviewed
      if (isAuthenticated && user?.id) {
        const already = reviewsRes.data.reviews.some(r => r.userId === user.id);
        setHasReviewed(already);
      }
    } catch {
      setError('Course not found.');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, user?.id]);

  // Check enrollment
  const checkEnrollment = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get(`/courses/${id}/enrollment-status`);
      setEnrolled(res.data.enrolled);
    } catch {}
  }, [id, isAuthenticated]);

  useEffect(() => { fetchData(); checkEnrollment(); }, [fetchData, checkEnrollment]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/courses/${id}`);
      navigate('/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course.');
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  const handleReviewSubmitted = (newReview) => {
    setReviews(prev => [newReview, ...prev]);
    setHasReviewed(true);
    setEnrolled(true);
    // Update course rating
    setCourse(prev => {
      if (!prev) return prev;
      const allRatings = [...reviews, newReview].map(r => r.rating);
      const avg = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
      return { ...prev, rating: Math.round(avg * 10) / 10, reviewCount: allRatings.length };
    });
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="page-wrapper">
      <div className="page-loading">
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3, borderTopColor: 'var(--primary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading course...</span>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error || !course) return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>😕</div>
        <h2 style={{ marginBottom: 12 }}>Course Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>{error}</p>
        <Link to="/courses" className="btn btn-primary">← Back to Courses</Link>
      </div>
    </div>
  );

  /* ── Rating summary ── */
  const avgRating = course.rating || 0;
  const reviewCount = reviews.length;

  return (
    <div className="page-wrapper">

      {/* ══ Hero Section ══════════════════════════════════════════ */}
      <section className="course-detail-hero">
        <div className="container">
          {/* Back */}
          <Link to="/courses" className="course-detail-back">
            ← Back to Courses
          </Link>

          <div className="course-detail-grid">
            {/* ── Left: Course Info ── */}
            <div className="course-detail-main">
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <span className={`badge ${LEVEL_COLOR[course.level] || 'badge-primary'}`}>{course.level}</span>
                <span className="badge badge-primary">{course.category}</span>
                {course.price === 'Free' && <span className="badge badge-success">Free</span>}
              </div>

              <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 18, lineHeight: 1.3 }}>
                {course.title}
              </h1>
              <p style={{ color: 'var(--text-1)', fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
                {course.description}
              </p>

              {/* Rating Summary */}
              {reviewCount > 0 && (
                <div className="reviews-summary">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="reviews-avg">{avgRating.toFixed(1)}</span>
                    <StarRating rating={avgRating} size={18} showNumber={false} />
                  </div>
                  <span style={{ color: 'var(--text-1)', fontSize: 14 }}>
                    ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              {/* Meta */}
              <div className="course-meta-grid">
                <div className="course-meta-item"><span>👤</span><strong>{course.instructorName}</strong></div>
                {course.duration && <div className="course-meta-item"><span>⏱️</span>{course.duration}</div>}
                <div className="course-meta-item"><span>👥</span>{course.enrolledCount} enrolled</div>
                {course.modules?.length > 0 && <div className="course-meta-item"><span>📑</span>{course.modules.length} modules</div>}
                <div className="course-meta-item">
                  <span>📅</span>
                  Added {new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Owner actions */}
              {isOwner && (
                <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                  <button id="edit-course-btn" className="btn btn-secondary" onClick={() => setShowEdit(true)}>
                    ✏️ Edit Course
                  </button>
                  {!deleteConfirm ? (
                    <button id="delete-course-btn" className="btn btn-danger" onClick={() => setDeleteConfirm(true)}>
                      🗑️ Delete Course
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#ff8fa3' }}>⚠️ Confirm delete?</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)} disabled={deleteLoading}>Cancel</button>
                      <button id="confirm-delete-btn" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleteLoading}>
                        {deleteLoading ? <span className="spinner spinner-sm" /> : 'Yes, Delete'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: Sticky CTA Card ── */}
            <div className="course-detail-sidebar">
              <div className="course-detail-sidebar-thumb">
                {course.thumbnail
                  ? <img src={course.thumbnail} alt={course.title} />
                  : <span style={{ fontSize: 56 }}>{EMOJI_MAP[course.category] || '📚'}</span>
                }
              </div>

              <div className="course-detail-sidebar-body">
                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span className={`course-price ${course.price === 'Free' ? 'course-price-free' : 'course-price-paid'}`} style={{ fontSize: 28 }}>{course.price}</span>
                  {course.price !== 'Free' && (
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>one-time</span>
                  )}
                </div>

                {/* Enroll component */}
                <EnrollSection course={course} isOwner={isOwner} />

                {/* Course includes */}
                <div className="enroll-includes">
                  <div className="enroll-includes-title">This course includes:</div>
                  {[
                    course.modules?.length > 0 && `📑 ${course.modules.length} module${course.modules.length !== 1 ? 's' : ''}`,
                    course.duration && `⏱️ ${course.duration} of content`,
                    '📱 Access on all devices',
                    '🏆 Certificate on completion',
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} className="enroll-include-item">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Course Body ══════════════════════════════════════════ */}
      <div className="container" style={{ padding: '48px 24px 64px' }}>
        <div style={{ maxWidth: 800 }}>

          {/* Module List */}
          {course.modules?.length > 0 && (
            <ModuleList modules={course.modules} />
          )}

          {/* ── Reviews Section ─────────────────────────────── */}
          <div className="reviews-section">
            <div className="reviews-header">
              <h2 className="reviews-title">⭐ Reviews</h2>
              {reviewCount > 0 && (
                <div className="reviews-summary">
                  <span className="reviews-avg">{avgRating.toFixed(1)}</span>
                  <StarRating rating={avgRating} size={16} showNumber={false} />
                  <span style={{ fontSize: 13, color: 'var(--text-1)' }}>({reviewCount})</span>
                </div>
              )}
            </div>

            {/* Review Form — only for enrolled non-owners who haven't reviewed */}
            {!isOwner && isAuthenticated && enrolled && !hasReviewed && (
              <ReviewForm courseId={id} onSubmitted={handleReviewSubmitted} />
            )}

            {/* Prompt to enroll if not enrolled */}
            {!isOwner && isAuthenticated && !enrolled && (
              <div style={{
                padding: 20, marginBottom: 24, textAlign: 'center',
                background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-0)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-1)', fontSize: 14,
              }}>
                🔒 You must be enrolled to leave a review.
              </div>
            )}

            {/* Prompt to log in */}
            {!isAuthenticated && (
              <div style={{
                padding: 20, marginBottom: 24, textAlign: 'center',
                background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-0)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-1)', fontSize: 14,
              }}>
                <Link to="/login">Log in</Link> and enroll to leave a review.
              </div>
            )}

            {/* Already reviewed notice */}
            {!isOwner && hasReviewed && (
              <div className="alert alert-success" style={{ marginBottom: 20 }}>
                ✅ You've already reviewed this course. Thank you!
              </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <div className="empty-state-icon" style={{ fontSize: 40 }}>💬</div>
                <h3>No reviews yet</h3>
                <p>Be the first to share your experience with this course.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditCourseModal
          course={course}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => { setCourse(updated); setShowEdit(false); }}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;
