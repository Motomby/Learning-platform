import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/StarRating';

const CATEGORIES = [
  'all', 'Programming', 'Design', 'Marketing', 'Web Development',
  'Mobile Development', 'Data Science', 'Business', 'Photography', 'Music', 'Other',
];
const LEVELS = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-primary' };
const PRICE_FILTERS = [
  { key: 'all', label: 'All Prices' },
  { key: 'free', label: ' Free' },
  { key: 'paid', label: ' Paid' },
];

const EMOJI_MAP = {
  'Programming': '', 'Design': '', 'Marketing': '',
  'Web Development': '', 'Mobile Development': '', 'Data Science': '📊',
  'Business': '', 'Photography': '', 'Music': '', 'Other': '',
};

const CoursesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [priceType, setPriceType] = useState('all');
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (activeCategory !== 'all') params.category = activeCategory;
      if (priceType !== 'all') params.priceType = priceType;
      const res = await api.get('/courses', { params });
      setCourses(res.data.courses);
    } catch {
      setError('Failed to load courses. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, priceType]); // eslint-disable-line

  useEffect(() => { fetchCourses(); }, [activeCategory, priceType]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  return (
    <div className="page-wrapper">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="courses-header">
        <div className="container">
          {/* Title Row */}
          <div className="courses-header-row">
            <div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginBottom: 8 }}>
                Explore <span className="gradient-text">Courses</span>
              </h1>
              <p className="courses-header-count">
                {loading ? 'Loading...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
            {isAuthenticated && (
              <button
                id="go-create-course-btn"
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                Teach a Course
              </button>
            )}
          </div>

          {/* ── Search Bar ──────────────────────────────────────── */}
          <form onSubmit={handleSearch} className="search-bar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: 0 }}>
              <span className="input-icon">🔍</span>
              <input
                id="courses-search-input"
                className="form-input"
                type="text"
                placeholder="Search by title, description, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" id="courses-search-btn">Search</button>
            {search && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setSearch(''); setTimeout(fetchCourses, 50); }}
              >
                ✕ Clear
              </button>
            )}
          </form>

          {/* ── Category Chips ───────────────────────────────────── */}
          <div className="filter-row">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                id={`cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {cat === 'all' ? 'All' : `${EMOJI_MAP[cat] || ''} ${cat}`}
              </button>
            ))}
          </div>

          {/* ── Price Filter ─────────────────────────────────────── */}
          <div className="courses-price-row">
            <span className="courses-price-label">Price:</span>
            {PRICE_FILTERS.map(pf => (
              <button
                key={pf.key}
                className={`filter-chip ${priceType === pf.key ? 'active' : ''}`}
                onClick={() => setPriceType(pf.key)}
                id={`price-${pf.key}`}
              >
                {pf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Courses Grid ─────────────────────────────────────────── */}
      <div className="container" style={{ padding: '40px 24px 60px' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {loading ? (
          <div className="page-loading">
            <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
            <span style={{ color: 'var(--text-1)' }}>Loading courses...</span>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No courses found</h3>
            <p>
              {search
                ? `No results for "${search}". Try different keywords or clear the search.`
                : 'No courses match these filters yet. Be the first to create one!'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              {(search || activeCategory !== 'all' || priceType !== 'all') && (
                <button
                  className="btn btn-secondary"
                  onClick={() => { setSearch(''); setActiveCategory('all'); setPriceType('all'); }}
                >
                  Clear All Filters
                </button>
              )}
              {isAuthenticated && (
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                  Create a Course
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
                id={`course-card-${course.id}`}
              >
                <div className="course-card" style={{ height: '100%', width: '100%' }}>
                  {/* Thumbnail */}
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="course-thumbnail" />
                  ) : (
                    <div className="course-thumbnail-placeholder">
                      {EMOJI_MAP[course.category] || '📚'}
                    </div>
                  )}

                  <div className="course-card-body">
                    {/* Badges */}
                    <div className="course-card-tags">
                      <span className={`badge ${LEVELS[course.level] || 'badge-primary'}`}>
                        {course.level}
                      </span>
                      <span className="badge badge-primary">{course.category}</span>
                    </div>

                    {/* Title + Desc */}
                    <h3 className="course-card-title">{course.title}</h3>
                    <p className="course-card-desc">{course.description}</p>

                    {/* Rating */}
                    {course.reviewCount > 0 && (
                      <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StarRating rating={course.rating} size={13} showNumber={true} />
                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                          ({course.reviewCount} review{course.reviewCount !== 1 ? 's' : ''})
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="course-card-footer">
                      <div className="course-card-meta">
                        <span className="course-card-meta-item">👤 {course.instructorName}</span>
                        {course.duration && (
                          <span className="course-card-meta-item">⏱ {course.duration}</span>
                        )}
                        {course.enrolledCount > 0 && (
                          <span className="course-card-meta-item">👥 {course.enrolledCount}</span>
                        )}
                      </div>
                      <span className={`course-price ${course.price === 'Free' ? 'course-price-free' : 'course-price-paid'}`}>{course.price}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
