import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../components/Icons';

const TOPICS = [
  { label: 'Web Development', cat: 'Web Development' },
  { label: 'AI & Data Science', cat: 'Data Science' },
  { label: 'UI/UX Design', cat: 'Design' },
  { label: 'Cybersecurity', cat: 'Other' },
  { label: 'Cloud Computing', cat: 'Programming' },
  { label: 'Business Strategy', cat: 'Business' },
];

const CATEGORIES = [
  {
    title: 'Web & Mobile Development',
    categoryName: 'Web Development',
    desc: 'Master React, Node.js, Python, Flutter, and modern cloud architectures.',
    coursesCount: '120+ Courses',
    icon: Icons.Compass,
    gradient: 'linear-gradient(135deg, rgba(124, 107, 255, 0.15) 0%, rgba(0, 242, 254, 0.1) 100%)',
    borderColor: 'rgba(124, 107, 255, 0.3)',
  },
  {
    title: 'Data Science & Artificial Intelligence',
    categoryName: 'Data Science',
    desc: 'Learn Machine Learning, Neural Networks, Data Analytics, and Python.',
    coursesCount: '85+ Courses',
    icon: Icons.TrendingUp,
    gradient: 'linear-gradient(135deg, rgba(0, 201, 167, 0.15) 0%, rgba(0, 242, 254, 0.1) 100%)',
    borderColor: 'rgba(0, 201, 167, 0.3)',
  },
  {
    title: 'UI/UX & Product Design',
    categoryName: 'Design',
    desc: 'Create beautiful user interfaces, design systems, and interactive wireframes in Figma.',
    coursesCount: '65+ Courses',
    icon: Icons.Layers,
    gradient: 'linear-gradient(135deg, rgba(255, 107, 157, 0.15) 0%, rgba(124, 107, 255, 0.1) 100%)',
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  {
    title: 'Business & Entrepreneurship',
    categoryName: 'Business',
    desc: 'Gain skills in Agile management, startup strategy, product growth, and finance.',
    coursesCount: '50+ Courses',
    icon: Icons.Target,
    gradient: 'linear-gradient(135deg, rgba(255, 179, 71, 0.15) 0%, rgba(255, 107, 157, 0.1) 100%)',
    borderColor: 'rgba(255, 179, 71, 0.3)',
  },
  {
    title: 'Cybersecurity & Cloud Systems',
    categoryName: 'Programming',
    desc: 'Protect digital assets with ethical hacking, AWS cloud deployment, and DevOps.',
    coursesCount: '45+ Courses',
    icon: Icons.Shield,
    gradient: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(124, 107, 255, 0.1) 100%)',
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  {
    title: 'Digital Marketing & Content',
    categoryName: 'Marketing',
    desc: 'Drive growth with SEO, social media marketing, analytics, and content strategy.',
    coursesCount: '40+ Courses',
    icon: Icons.Zap,
    gradient: 'linear-gradient(135deg, rgba(124, 107, 255, 0.15) 0%, rgba(255, 179, 71, 0.1) 100%)',
    borderColor: 'rgba(124, 107, 255, 0.3)',
  },
];

const FEATURES = [
  {
    Icon: Icons.Shield,
    title: 'Verified Expert Instructors',
    desc: 'Learn directly from practicing engineers, lead designers, and industry veterans who teach real-world skills.',
  },
  {
    Icon: Icons.BookOpen,
    title: 'Hands-On Real Projects',
    desc: 'Build portfolio-ready web apps, AI models, and design systems with step-by-step practical modules.',
  },
  {
    Icon: Icons.Target,
    title: '100% Self-Paced Learning',
    desc: 'Enjoy lifetime access with no rigid deadlines or expiration dates. Study whenever fits your personal schedule.',
  },
  {
    Icon: Icons.Award,
    title: 'Shareable Certificates',
    desc: 'Earn official certificates of completion to highlight your verified skills on LinkedIn and resumes.',
  },
  {
    Icon: Icons.TrendingUp,
    title: 'Track Your Progress',
    desc: 'Interactive personal dashboard helps you monitor completed modules, quizzes, and upcoming milestones.',
  },
  {
    Icon: Icons.Users,
    title: 'Collaborative Community',
    desc: 'Ask questions, get feedback, and join discussions with thousands of ambitious learners around the globe.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Choose Your Skill Path',
    desc: 'Browse hundreds of expert-crafted courses across Web Dev, AI, Design, and Business to find your ideal focus area.',
    icon: Icons.Compass,
  },
  {
    step: '02',
    title: 'Learn by Doing',
    desc: 'Watch HD video modules, follow along with source code, and complete interactive practical exercises.',
    icon: Icons.BookOpen,
  },
  {
    step: '03',
    title: 'Get Support & Feedback',
    desc: 'Ask questions in module discussion boards and receive direct guidance from verified instructors.',
    icon: Icons.MessageSquare,
  },
  {
    step: '04',
    title: 'Earn & Advance Your Career',
    desc: 'Download your course completion certificate and showcase your new portfolio projects to top hiring managers.',
    icon: Icons.Award,
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Jenkins',
    role: 'Frontend Developer at TechCorp',
    avatar: 'SJ',
    story: 'LearnHub gave me the practical coding confidence I couldn’t get from tutorials. In 6 months, I built 4 portfolio projects and landed my dream frontend developer job!',
    rating: 5,
    tag: 'Career Switcher',
  },
  {
    name: 'Marcus Chen',
    role: 'Product Designer',
    avatar: 'MC',
    story: 'The UI/UX design masterclasses completely upgraded my workflow. The instructor feedback on my design systems doubled my freelance client conversion rate!',
    rating: 5,
    tag: 'Freelancer',
  },
  {
    name: 'Elena Rostova',
    role: 'Data Analyst at CloudScale',
    avatar: 'ER',
    story: 'The Python & Data Science modules are structured brilliantly. The hands-on SQL and machine learning projects were exactly what my interviewers asked about.',
    rating: 5,
    tag: 'Skill Upgrader',
  },
];

const FAQS = [
  {
    q: 'Are the courses on LearnHub self-paced?',
    a: 'Yes! All courses on LearnHub are 100% self-paced. Once enrolled, you receive lifetime access to all video lessons, project files, and resources so you can study at your own speed.',
  },
  {
    q: 'Will I receive a certificate when I finish a course?',
    a: 'Absoluting! Upon completing all modules in a course, you earn an official LearnHub Certificate of Completion. You can download it as a PDF or share it directly on your LinkedIn profile.',
  },
  {
    q: 'How do I become an instructor and publish a course?',
    a: 'Publishing a course is straightforward! Log into your account, visit your Dashboard, click "Teach a Course", fill in your course title, curriculum modules, and video links, and publish instantly.',
  },
  {
    q: 'Are there free courses available on LearnHub?',
    a: 'Yes! We offer both free foundational courses and premium masterclasses. You can filter by "Free" or "Paid" on the Course Catalog page to start learning without any upfront cost.',
  },
  {
    q: 'What if I get stuck or have questions during a lesson?',
    a: 'Every course module features a discussion tab where you can post questions, receive direct answers from the instructor, and collaborate with fellow students.',
  },
];

const STATS = [
  { value: '10,000+', label: 'Active Students' },
  { value: '500+', label: 'Expert Courses' },
  { value: '250+', label: 'Verified Instructors' },
  { value: '98.4%', label: 'Satisfaction Rate' },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  return (
    <div className="page-wrapper">

      {/* ══ 1. HERO SECTION ════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-mesh">
          <div className="mesh-orb mesh-orb-1" />
          <div className="mesh-orb mesh-orb-2" />
          <div className="mesh-orb mesh-orb-3" />
        </div>
        <div className="container hero-inner">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            🚀 Over 10,000+ Learners Building In-Demand Career Skills
          </div>

          <h1>
            Master New Skills with<br className="desktop-only-br" />
            <span className="gradient-text"> World-Class Courses</span>
          </h1>
          <p className="hero-sub">
            Join thousands of students learning full-stack development, AI, design, and business leadership.
            Learn from verified industry experts, complete real projects, and accelerate your career.
          </p>

          <div className="hero-cta">
            <Link to="/courses" className="btn btn-primary btn-lg">
              <Icons.Compass size={18} />
              Explore All Courses
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

          {/* Popular Topics Bar */}
          <div className="hero-topics-bar">
            <span className="topics-label">🔥 Trending Topics:</span>
            <div className="topics-list">
              {TOPICS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="topic-pill"
                  onClick={() => navigate(`/courses?category=${encodeURIComponent(item.cat)}`)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Showcase Glass Card */}
          <div className="hero-preview-card">
            <div className="preview-card-header">
              <span className="preview-badge">✨ Featured Track</span>
              <div className="preview-rating">
                <Icons.Star size={14} filled={true} style={{ color: '#ffb347' }} />
                <span>4.9 (1,240 reviews)</span>
              </div>
            </div>
            <h3 className="preview-title">Full-Stack Web Architecture & AI Integration</h3>
            <p className="preview-desc">
              Master React 19, Node.js REST APIs, database design, and integrating OpenAI models into web apps.
            </p>
            <div className="preview-meta">
              <span>📚 42 Lessons</span>
              <span>⏱ 18.5 Hours</span>
              <span>🏆 Certificate Included</span>
            </div>
            <div className="preview-footer">
              <div className="preview-instructor">
                <div className="instructor-avatar">AV</div>
                <div>
                  <div className="instructor-name">Alex Vance</div>
                  <div className="instructor-role">Senior Software Architect</div>
                </div>
              </div>
              <Link to="/courses" className="btn btn-primary btn-sm">
                View Track
              </Link>
            </div>
          </div>

          {/* Key Stats */}
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

      {/* ══ 2. TOP CATEGORIES GRID ═════════════════════════════════ */}
      <section className="section bg-surface-1">
        <div className="container">
          <div className="section-header-center">
            <div className="section-label">
              <Icons.Grid size={14} />
              Explore Disciplines
            </div>
            <h2 className="section-title">
              Top Learning <span className="gradient-text">Categories</span>
            </h2>
            <p className="section-sub">
              Choose from structured learning paths designed to take you from beginner to job-ready professional.
            </p>
          </div>

          <div className="category-grid">
            {CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <div
                  key={cat.title}
                  className="category-card"
                  style={{ background: cat.gradient, borderColor: cat.borderColor }}
                  onClick={() => navigate(`/courses?category=${encodeURIComponent(cat.categoryName)}`)}
                >
                  <div className="cat-card-top">
                    <div className="cat-icon-box">
                      <CatIcon size={24} color="#7c6bff" />
                    </div>
                    <span className="cat-count-badge">{cat.coursesCount}</span>
                  </div>
                  <h3 className="cat-title">{cat.title}</h3>
                  <p className="cat-desc">{cat.desc}</p>
                  <div className="cat-action">
                    <span>Browse Courses</span>
                    <Icons.ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 3. WHY LEARNHUB (FEATURES) ═════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="section-header-center">
            <div className="section-label">
              <Icons.Zap size={14} />
              Why LearnHub
            </div>
            <h2 className="section-title">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </h2>
            <p className="section-sub">
              Built for ambitious learners and passionate instructors with cutting-edge tools and simple navigation.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map(({ Icon, title, desc }, i) => (
              <div className="feature-card" key={i}>
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

      {/* ══ 4. HOW IT WORKS (4 STEPS) ══════════════════════════════ */}
      <section className="section bg-surface-1">
        <div className="container">
          <div className="section-header-center">
            <div className="section-label">
              <Icons.Target size={14} />
              Simple 4-Step Process
            </div>
            <h2 className="section-title">
              How <span className="gradient-text">LearnHub Works</span>
            </h2>
            <p className="section-sub">
              From picking your first course to earning your certificate, our platform makes learning seamless.
            </p>
          </div>

          <div className="workflow-steps">
            {STEPS.map(({ step, title, desc, icon: StepIcon }) => (
              <div className="workflow-step-card" key={step}>
                <div className="step-badge">{step}</div>
                <div className="step-icon-wrap">
                  <StepIcon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. STUDENT SUCCESS STORIES (TESTIMONIALS) ══════════════ */}
      <section className="section">
        <div className="container">
          <div className="section-header-center">
            <div className="section-label">
              <Icons.Users size={14} />
              Student Success Stories
            </div>
            <h2 className="section-title">
              Loved by Learners <span className="gradient-text">Worldwide</span>
            </h2>
            <p className="section-sub">
              Discover how thousands of students upgraded their skills and launched new careers with LearnHub.
            </p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-header">
                  <div className="t-avatar">{t.avatar}</div>
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role}</div>
                  </div>
                  <span className="t-tag-badge">{t.tag}</span>
                </div>
                <div className="t-stars">
                  {[...Array(t.rating)].map((_, idx) => (
                    <Icons.Star key={idx} size={14} filled={true} style={{ color: '#ffb347' }} />
                  ))}
                </div>
                <p className="t-quote">"{t.story}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. INSTRUCTOR INVITATION BANNER ═══════════════════════ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="instructor-banner">
            <div className="instructor-banner-content">
              <div className="section-label" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                <Icons.Layers size={14} />
                Teach on LearnHub
              </div>
              <h2>Share Your Expertise & <span className="gradient-text">Earn Income</span></h2>
              <p>
                Join hundreds of instructors creating video courses and inspiring over 10,000+ students worldwide.
                Build your curriculum, publish modules, and start earning today.
              </p>
              <div className="instructor-perks">
                <div className="perk-item">
                  <Icons.CheckCircle size={16} color="#00c9a7" />
                  <span>Unlimited Course Uploads</span>
                </div>
                <div className="perk-item">
                  <Icons.CheckCircle size={16} color="#00c9a7" />
                  <span>Structured Module Editor</span>
                </div>
                <div className="perk-item">
                  <Icons.CheckCircle size={16} color="#00c9a7" />
                  <span>Global Student Reach</span>
                </div>
              </div>
              <div className="instructor-actions">
                <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
                  <Icons.Plus size={16} />
                  Start Teaching Today
                </Link>
                <Link to="/courses" className="btn btn-ghost btn-lg">
                  Browse Existing Courses
                </Link>
              </div>
            </div>
            <div className="instructor-stat-card">
              <div className="inst-stat-box">
                <div className="inst-stat-num">$4,500+</div>
                <div className="inst-stat-lbl">Average Monthly Instructor Earnings</div>
              </div>
              <div className="inst-stat-divider" />
              <div className="inst-stat-box">
                <div className="inst-stat-num">250+</div>
                <div className="inst-stat-lbl">Verified Active Instructors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. FAQ ACCORDION ══════════════════════════════════════ */}
      <section className="section bg-surface-1">
        <div className="container" style={{ maxWidth: 840 }}>
          <div className="section-header-center">
            <div className="section-label">
              <Icons.Info size={14} />
              Got Questions?
            </div>
            <h2 className="section-title">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="section-sub">
              Everything you need to know about learning, certificates, and teaching on LearnHub.
            </p>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button type="button" className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                    <span>{faq.q}</span>
                    <Icons.ChevronDown size={18} className={`faq-icon ${isOpen ? 'open' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="faq-answer animate-slide-down">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ 8. BOTTOM CTA BANNER ══════════════════════════════════ */}
      {!isAuthenticated && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="cta-banner">
              <h2>Ready to Accelerate Your <span className="gradient-text">Career?</span></h2>
              <p>Create your free account today and join 10,000+ students mastering in-demand skills.</p>
              <div className="cta-banner-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started for Free
                  <Icons.ArrowRight size={16} />
                </Link>
                <Link to="/courses" className="btn btn-secondary btn-lg">
                  <Icons.BookOpen size={16} />
                  Browse Catalog
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ 9. FOOTER ═════════════════════════════════════════════ */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col-brand">
              <div className="site-footer-logo">
                <div className="logo-mark" style={{ width: 32, height: 32, borderRadius: 9 }}>
                  <Icons.GraduationCap size={18} color="#fff" strokeWidth={2.2} />
                </div>
                <span className="logo-text">Learn<span className="logo-highlight">Hub</span></span>
              </div>
              <p className="footer-brand-desc">
                Empowering learners worldwide with expert-crafted courses, interactive project learning, and shareable certificates.
              </p>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <ul>
                <li><Link to="/">Explore Home</Link></li>
                <li><Link to="/courses">Course Catalog</Link></li>
                <li><Link to={isAuthenticated ? '/dashboard' : '/login'}>Dashboard</Link></li>
                <li><Link to="/register">Create Account</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Top Categories</h4>
              <ul>
                <li><Link to="/courses?category=Web%20Development">Web Development</Link></li>
                <li><Link to="/courses?category=Data%20Science">AI & Data Science</Link></li>
                <li><Link to="/courses?category=Design">UI/UX Design</Link></li>
                <li><Link to="/courses?category=Business">Business & Growth</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Platform Info</h4>
              <ul className="footer-info-list">
                <li><span>🔒 JWT & Bcrypt Secured</span></li>
                <li><span>📜 Shareable Certificates</span></li>
                <li><span>⚡ 24/7 Unlimited Access</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 LearnHub. Built with passion for learners and instructors everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
