import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../components/Icons';

const FEATURES = [
  { Icon: Icons.Shield, title: 'Secure Authentication', desc: 'JWT-powered login with bcrypt password hashing. Your data stays protected with industry-standard security.' },
  { Icon: Icons.BookOpen, title: 'Rich Course Library', desc: 'Browse hundreds of expert-crafted courses across technology, design, business, and more.' },
  { Icon: Icons.Target, title: 'Learn at Your Pace', desc: 'No deadlines, no pressure. Access course content 24/7 and study whenever fits your schedule.' },
  { Icon: Icons.TrendingUp, title: 'Track Your Progress', desc: 'Personalized dashboards help you see exactly how far you have come and what is next.' },
  { Icon: Icons.Layers, title: 'Become an Instructor', desc: 'Share your expertise with the world. Build a structured curriculum with modules and publish in minutes.' },
  { Icon: Icons.Users, title: 'Community Driven', desc: 'Join a vibrant community of learners and instructors who support each other to grow.' },
];

const STATS = [
  { value: '10K+', label: 'Active Students' },
  { value: '500+', label: 'Expert Courses' },
  { value: '200+', label: 'Instructors' },
  { value: '98%', label: 'Satisfaction Rate' },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page-wrapper">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-mesh">
          <div className="mesh-orb mesh-orb-1" />
          <div className="mesh-orb mesh-orb-2" />
          <div className="mesh-orb mesh-orb-3" />
        </div>
        <div className="container hero-inner">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            The future of online learning
          </div>

          <h1>
            Master New Skills with<br />
            <span className="gradient-text">World-Class Courses</span>
          </h1>
          <p>
            Join thousands of learners building in-demand skills. Learn from verified instructors,
            complete real projects, and advance your career — all at your own pace.
          </p>

          <div className="hero-cta">
            <Link to="/courses" className="btn btn-primary btn-lg">
              <Icons.Compass size={18} />
              Explore Courses
            </Link>
            {!isAuthenticated ? (
              <Link to="/register" className="btn btn-secondary btn-lg">
                Create Free Account
                <Icons.ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/dashboard" className="btn btn-secondary btn-lg">
                <Icons.Grid size={16} />
                Go to Dashboard
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {STATS.map(({ value, label }) => (
              <div className="hero-stat" key={label}>
                <div className="hero-stat-value">{value}</div>
                <div className="hero-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="section-label">
              <Icons.Zap size={14} />
              Why LearnHub
            </div>
            <h2 className="section-title">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Built for learners and instructors alike, with security and simplicity at the core.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="feature-icon-wrap">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════════ */}
      {!isAuthenticated && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="cta-banner">
              <h2>Ready to Start <span className="gradient-text">Learning?</span></h2>
              <p>Create your free account and get instant access to hundreds of expert courses today.</p>
              <div className="cta-banner-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started — It's Free
                  <Icons.ArrowRight size={16} />
                </Link>
                <Link to="/courses" className="btn btn-secondary btn-lg">
                  <Icons.BookOpen size={16} />
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer className="site-footer">
        <div className="container">
          <div className="site-footer-logo">
            <div className="logo-mark" style={{ width: 28, height: 28, borderRadius: 8 }}>
              <Icons.GraduationCap size={14} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-2)', fontSize: 15 }}>LearnHub</span>
          </div>
          <p>© 2024 LearnHub. Built with passion for learners everywhere.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
