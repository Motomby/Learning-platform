import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from './Icons';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const dropdownRef = useRef(null);

  // Scroll effect to apply elevation and border change
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserDropdownOpen(false);
    setMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  };

  const isActive = (p) => location.pathname === p;
  const initials = (user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo" title="LearnHub Home">
          <div className="logo-mark">
            <Icons.GraduationCap size={22} color="#fff" strokeWidth={2.2} />
          </div>
          <span className="logo-text">
            Learn<span className="logo-highlight">Hub</span>
          </span>
        </Link>

        {/* Navbar Search (Desktop) */}
        <form className={`navbar-search ${searchFocused ? 'focused' : ''}`} onSubmit={handleSearchSubmit}>
          <Icons.Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search courses, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Search courses"
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>
              <Icons.X size={14} />
            </button>
          )}
        </form>

        {/* Main Desktop Links */}
        <ul className="navbar-links">
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <Icons.Compass size={16} className="nav-link-icon" />
              <span>Explore</span>
            </Link>
          </li>
          <li>
            <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'active' : ''}`}>
              <Icons.BookOpen size={16} className="nav-link-icon" />
              <span>Courses</span>
            </Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                <Icons.Grid size={16} className="nav-link-icon" />
                <span>Dashboard</span>
              </Link>
            </li>
          )}
        </ul>

        {/* Right Section */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <div className="user-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className={`nav-user-chip ${userDropdownOpen ? 'active' : ''}`}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
              >
                <div className="nav-avatar">
                  {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt={user.fullName || 'User'} />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <span className="user-chip-name">{user?.fullName?.split(' ')[0] || user?.username}</span>
                <Icons.ChevronDown size={14} className={`chip-chevron ${userDropdownOpen ? 'open' : ''}`} />
              </button>

              {/* User Dropdown Popover */}
              {userDropdownOpen && (
                <div className="user-menu-dropdown animate-pop">
                  <div className="dropdown-user-header">
                    <div className="dropdown-avatar">
                      {user?.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} alt="profile" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="dropdown-user-details">
                      <div className="dropdown-user-name">{user?.fullName || user?.username}</div>
                      <div className="dropdown-user-email">{user?.email}</div>
                      <span className="role-badge">{user?.role || 'Student'}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-nav-list">
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                      <Icons.Grid size={16} />
                      <span>My Dashboard</span>
                    </Link>
                    <Link to="/courses" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                      <Icons.BookMark size={16} />
                      <span>Browse Catalog</span>
                    </Link>
                    {user?.role === 'instructor' || user?.role === 'admin' ? (
                      <Link to="/dashboard" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Icons.Plus size={16} />
                        <span>Manage Courses</span>
                      </Link>
                    ) : null}
                  </div>

                  <div className="dropdown-divider" />

                  <button type="button" className="dropdown-item logout-item" onClick={handleLogout}>
                    <Icons.LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth-btns">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm nav-cta-btn">
                <span>Get Started</span>
                <Icons.ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className={`mobile-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <Icons.X size={22} /> : <Icons.Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {menuOpen && (
        <div className="mobile-menu animate-slide-down">
          {/* Mobile Search */}
          <form className="mobile-search-form" onSubmit={handleSearchSubmit}>
            <Icons.Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Logged in User Header in Mobile Menu */}
          {isAuthenticated && (
            <div className="mobile-user-card">
              <div className="nav-avatar">
                {user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="user" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="mobile-user-info">
                <span className="mobile-user-name">{user?.fullName || user?.username}</span>
                <span className="mobile-user-email">{user?.email}</span>
                <span className="role-badge">{user?.role || 'Student'}</span>
              </div>
            </div>
          )}

          {/* Mobile Navigation Links */}
          <div className="mobile-links-list">
            <Link
              to="/"
              className={`mobile-menu-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icons.Compass size={18} />
              <span>Explore Home</span>
            </Link>
            <Link
              to="/courses"
              className={`mobile-menu-link ${isActive('/courses') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icons.BookOpen size={18} />
              <span>Browse Courses</span>
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`mobile-menu-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icons.Grid size={18} />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          <div className="mobile-menu-divider" />

          {/* Mobile Auth Actions */}
          {!isAuthenticated ? (
            <div className="mobile-auth-grid">
              <Link
                to="/login"
                className="btn btn-secondary mobile-menu-btn"
                onClick={() => setMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary mobile-menu-btn"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost mobile-logout-btn" onClick={handleLogout}>
              <Icons.LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
