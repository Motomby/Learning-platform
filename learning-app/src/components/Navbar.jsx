import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from './Icons';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const isActive = (p) => location.pathname === p ? 'nav-link active' : 'nav-link';
  const initials = (user?.fullName || user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-mark">
            <Icons.GraduationCap size={20} color="#fff" strokeWidth={2} />
          </div>
          LearnHub
        </Link>

        {/* Desktop Links */}
        <ul className="navbar-links">
          <li><Link to="/" className={isActive('/')}>Home</Link></li>
          <li><Link to="/courses" className={isActive('/courses')}>Courses</Link></li>
          {isAuthenticated && <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>}
        </ul>

        {/* Right Actions */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <button className="nav-avatar" onClick={() => navigate('/dashboard')} title={user?.fullName || user?.username}>
                {user?.profilePictureUrl ? <img src={user.profilePictureUrl} alt="avatar" /> : initials}
              </button>
              <div className="nav-divider" />
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ gap: 6 }}>
                <Icons.LogOut size={14} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
          <button className="mobile-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {[['/', 'Home'], ['/courses', 'Courses'], ...(isAuthenticated ? [['/dashboard', 'Dashboard']] : [])].map(([href, label]) => (
            <Link key={href} to={href} className="btn btn-ghost mobile-menu-link" onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          <div className="mobile-menu-divider" />
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-secondary mobile-menu-btn" onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link to="/register" className="btn btn-primary mobile-menu-btn" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          ) : (
            <button className="btn btn-ghost mobile-menu-link" onClick={handleLogout} style={{ gap: 8 }}>
              <Icons.LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
