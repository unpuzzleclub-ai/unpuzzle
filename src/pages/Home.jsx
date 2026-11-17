
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Menu,
  X,
  Star,
  ShieldCheck,
  Heart,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Trophy,
  MonitorPlay,
} from "lucide-react";

import {
  SiInstagram,
  SiYoutube,
} from "react-icons/si";

import { FaLinkedinIn } from "react-icons/fa";

import "../styles/Home.css";

/* =========================================
   ACTIVITIES
========================================= */

const activities = [
  {
    name: "Chess",
    title: "Chess Classes for Kids",
    description: "Basic to Pro",
    image: "/assets/chess-card.webp",
    category: "Mind & Strategy",
    link: "/activities/chess",
  },
  {
    name: "Karate",
    title: "Karate Classes for Kids",
    description: "Karate for self-defense",
    image: "/assets/karate-card.webp",
    category: "Fitness & Discipline",
    link: "/activities/karate",
  },
  {
    name: "Art",
    title: "Arts Classes for Kids",
    description: "Beginner to advanced painting",
    image: "/assets/art-card.webp",
    category: "Creativity",
    link: "/activities/art",
  },
  {
    name: "Music/Dance",
    title: "Dance & Music Classes",
    description: "Music theory for all levels",
    image: "/assets/music-card.webp",
    category: "Expression",
    link: "/activities/dance",
  },
];

/* =========================================
   REVIEWS
========================================= */

const reviews = [
  {
    name: "Manish Gupta",
    count: "1 review",
    text: "Divyansh is a coach helping my children improve in chess. He is very humble and good at teaching.",
  },
  {
    name: "Shivi Sahu",
    count: "1 review",
    text: "Best academy for beginners and someone looking to pursue chess as a career. The coaches help clear concepts, and I am doing better each day.",
  },
  {
    name: "Rajeev Singh",
    count: "Local Guide · 25 reviews",
    text: "My daughter has had an amazing learning experience. The structured training, personalized attention, and competitive preparation have helped her improve her gameplay and confidence.",
  },
  {
    name: "Humera Nazeen Shaik",
    count: "3 reviews",
    text: "The academy is well-suited for those new to chess or looking to improve. Coaches explain concepts in a simple and understandable manner.",
  },
  {
    name: "Rahul U S",
    count: "7 reviews",
    text: "My son had a very good experience. The coaches are friendly and encouraging. Recommended.",
  },
];

/* =========================================
   FEATURES
========================================= */

const features = [
  {
    icon: <Users />,
    title: "Expert Instructors",
    text: "Learn from instructors who guide children with care and experience.",
  },
  {
    icon: <ShieldCheck />,
    title: "Safe Environment",
    text: "A welcoming space where children can learn and grow confidently.",
  },
  {
    icon: <Heart />,
    title: "Learning with Joy",
    text: "Discover new interests through enjoyable learning experiences.",
  },
  {
    icon: <BookOpen />,
    title: "Skill Development",
    text: "Build creativity, discipline, focus, and problem-solving skills.",
  },
  {
    icon: <Star />,
    title: "Every Child Matters",
    text: "Encourage each child to progress at their own pace.",
  },
];

/* =========================================
   OPPORTUNITY PAGE CONFIGURATION
========================================= */

const opportunityPages = {
  events: {
    title: "Events",
    eyebrow: "EXPLORE & EXPERIENCE",
    description:
      "Discover exciting workshops, fun activities, community gatherings, and special experiences for children and families.",
    icon: CalendarDays,
    iconClass: "events",
    buttonText: "Register Now",
  },

  tournaments: {
    title: "Tournaments",
    eyebrow: "CHALLENGE YOURSELF",
    description:
      "Take part in exciting competitions, showcase your skills, gain experience, and celebrate every achievement.",
    icon: Trophy,
    iconClass: "tournaments",
    buttonText: "Register Now",
  },

  "online-classes": {
    title: "Online Classes",
    eyebrow: "LEARN FROM ANYWHERE",
    description:
      "Explore interactive online learning sessions led by instructors and develop new skills from the comfort of home.",
    icon: MonitorPlay,
    iconClass: "classes",
    buttonText: "Enroll Now",
  },
};

/* =========================================
   MAIN HOME COMPONENT
========================================= */

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Activities");
  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("Sign In");

  // Admin authentication states
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  /* =========================================
     DETECT OPPORTUNITY ROUTE
  ========================================= */

  const opportunityType = location.pathname.replace(/^\/|\/$/g, "");

  const opportunityPage = opportunityPages[opportunityType];

  /* =========================================
     OPEN AUTH MODAL
  ========================================= */

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthMessage("");
    setAuthEmail("");
    setAuthPassword("");
    setModalOpen(true);
  };

  /* =========================================
     ADMIN LOGIN
  ========================================= */

  const handleAdminLogin = async (event) => {
    event.preventDefault();

    if (authLoading) return;

    setAuthMessage("");
    setAuthLoading(true);

    try {
      // Authenticate with Supabase
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

      if (loginError) {
        throw loginError;
      }

      // Verify Admin authorization in database
      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_admin");

      if (adminError) {
        await supabase.auth.signOut();
        throw adminError;
      }

      // Reject accounts without Admin permissions
      if (isAdmin !== true) {
        await supabase.auth.signOut();

        setAuthMessage(
          "Access denied. This account is not authorized as an Admin."
        );

        return;
      }

      // Successful Admin login
      setModalOpen(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthMessage("");

      navigate("/admin");
    } catch (error) {
      console.error("Admin login error:", error);

      setAuthMessage(
        error.message || "Unable to sign in. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  /* =========================================
     CLOSE NAVIGATION
  ========================================= */

  const closeMenu = () => {
    setMenuOpen(false);
    setLeaderboardOpen(false);
  };

  /* =========================================
     OPPORTUNITY PAGE
  ========================================= */

  if (opportunityPage) {
    const PageIcon = opportunityPage.icon;

    return (
      <main className="opportunity-page">
        <header className="opportunity-page-header">
          <Link to="/" className="opportunity-page-brand">
            Unpuzzle Club
          </Link>

          <Link to="/" className="opportunity-back-link">
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </header>

        <section className="opportunity-page-content">
          <div className={`opportunity-page-icon ${opportunityPage.iconClass}`}>
            <PageIcon size={40} strokeWidth={1.8} />
          </div>

          <span className="section-eyebrow">
            {opportunityPage.eyebrow}
          </span>

          <h1>{opportunityPage.title}</h1>

          <p>{opportunityPage.description}</p>

          <div className="opportunity-listing-heading">
            <div>
              <h2>Explore {opportunityPage.title}</h2>
              <p>
                Discover upcoming opportunities from Unpuzzle Club.
              </p>
            </div>
          </div>

          <div className="opportunity-coming-soon">
            <div className="opportunity-empty-icon">
              <PageIcon size={35} />
            </div>

            <h2>Nothing published yet!</h2>

            <p>
              We're preparing exciting{" "}
              {opportunityPage.title.toLowerCase()} for the Unpuzzle Club
              community. Available opportunities and registrations will
              appear here.
            </p>

            <Link to="/" className="opportunity-home-button">
              Back to Homepage
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* =========================================
     HERO SLIDES
  ========================================= */

  const heroSlides = [
    {
      image: "/assets/chess-hero.webp",
      eyebrow: "PLAY • LEARN • GROW",
      title: "Unlock Your Potential with Unpuzzle Club",
      description:
        "A place for children to discover interests, develop skills, and grow with confidence.",
    },
    {
      image: "/assets/art-card1.webp",
      eyebrow: "EXPLORE YOUR CREATIVITY",
      title: "Every Child Has Something Special",
      description:
        "Discover new passions through fun, meaningful learning experiences.",
    },
    {
      image: "/assets/art-card2.webp",
      eyebrow: "LEARN SOMETHING NEW",
      title: "Build Skills That Last a Lifetime",
      description:
        "Explore activities that encourage confidence, curiosity, and personal growth.",
    },
  ];

  /* =========================================
     FILTER ACTIVITIES
  ========================================= */

  const visibleActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(search.toLowerCase()) ||
      activity.name.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All Activities" || activity.name === filter;

    return matchesSearch && matchesFilter;
  });

  /* =========================================
     CHANGE HERO SLIDE
  ========================================= */

  const changeSlide = (direction) => {
    setSlide(
      (current) =>
        (current + direction + heroSlides.length) % heroSlides.length
    );
  };

  /* =========================================
     HOMEPAGE
  ========================================= */

  return (
    <div className="homepage">

      {/* HEADER */}

      <header className="home-header">
        <div className="home-container header-inner">

          <a className="home-brand" href="/" aria-label="Unpuzzle Club home">
            <img src="/assets/unpuzzle-logo.png" alt="Unpuzzle Club" />
          </a>

          <button
            className="mobile-menu-button"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>

          <nav
            className={`home-navigation ${menuOpen ? "navigation-open" : ""}`}
            aria-label="Main navigation"
          >

            <div className="leaderboard-wrapper">
              <button
                className="navigation-link"
                type="button"
                onClick={() => setLeaderboardOpen(!leaderboardOpen)}
                aria-expanded={leaderboardOpen}
              >
                Leaderboard
                <ChevronDown
                  size={15}
                  className={leaderboardOpen ? "chevron-up" : ""}
                />
              </button>

              {leaderboardOpen && (
                <div className="leaderboard-dropdown">
                  <a href="/leaderboard" onClick={closeMenu}>
                    Activity Leaderboard
                  </a>
                  <a href="/leaderboard/chess" onClick={closeMenu}>
                    Chess Leaderboard
                  </a>
                  <a href="/leaderboard/learners" onClick={closeMenu}>
                    Top Learners
                  </a>
                </div>
              )}
            </div>

            <a
              className="navigation-link"
              href="#activities"
              onClick={closeMenu}
            >
              Activities
            </a>

            <a
              className="navigation-link"
              href="#why-us"
              onClick={closeMenu}
            >
              Why Unpuzzle?
            </a>

            <a
              className="navigation-link"
              href="#contact"
              onClick={closeMenu}
            >
              Contact
            </a>

            <div className="mobile-auth-actions">
              <button
                className="button button-outline"
                onClick={() => openAuth("Sign In")}
              >
                Sign In
              </button>

              <button
                className="button button-primary"
                onClick={() => openAuth("Sign Up")}
              >
                Sign Up
              </button>
            </div>

          </nav>

          <div className="header-actions">
            <button
              className="button button-outline"
              onClick={() => openAuth("Sign In")}
            >
              Sign In
            </button>

            <button
              className="button button-primary"
              onClick={() => openAuth("Sign Up")}
            >
              Sign Up
            </button>
          </div>

        </div>
      </header>

      <main>

        {/* HERO */}

        <section className="hero-section" aria-label="Welcome">
          <div
            className="hero-banner"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(10, 38, 28, .82), rgba(10, 38, 28, .25)), url("${heroSlides[slide].image}")`,
            }}
          >
            <div className="hero-copy">
              <span className="hero-eyebrow">
                {heroSlides[slide].eyebrow}
              </span>

              <h1>{heroSlides[slide].title}</h1>

              <p>{heroSlides[slide].description}</p>

              <a className="button hero-button" href="#activities">
                Explore Activities
                <ArrowRight size={18} />
              </a>
            </div>

            <button
              className="hero-arrow hero-arrow-left"
              onClick={() => changeSlide(-1)}
              aria-label="Previous slide"
            >
              <ChevronLeft size={25} />
            </button>

            <button
              className="hero-arrow hero-arrow-right"
              onClick={() => changeSlide(1)}
              aria-label="Next slide"
            >
              <ChevronRight size={25} />
            </button>
          </div>

          <div className="hero-dots" aria-label="Choose hero slide">
            {heroSlides.map((item, index) => (
              <button
                key={item.title}
                className={`hero-dot ${slide === index ? "active" : ""}`}
                onClick={() => setSlide(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={slide === index ? "true" : undefined}
              />
            ))}
          </div>
        </section>

        {/* ACTIVITIES */}

        <section className="activities-section home-container" id="activities">
          <div className="section-heading-row">
            <div>
              <span className="section-eyebrow">FIND YOUR PASSION</span>

              <h2 className="section-heading">Explore Activities</h2>

              <p className="section-description">
                Discover something you love. Learn, practise, and grow.
              </p>
            </div>

            <div className="activity-search">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search activities..."
                aria-label="Search activities"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="activity-filters" aria-label="Filter activities">
            {["All Activities"].map((item) => (
              <button
                type="button"
                key={item}
                className={`filter-pill ${
                  filter === item ? "filter-active" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="activity-grid">
            {visibleActivities.map((activity) => (
              <article className="activity-card" key={activity.name}>
                <a
                  className="activity-image-link"
                  href={activity.link}
                  aria-label={`Explore ${activity.name}`}
                >
                  <img
                    className="activity-image"
                    src={activity.image}
                    alt={activity.title}
                    loading="lazy"
                  />

                  <span className="activity-category">
                    {activity.category}
                  </span>
                </a>

                <div className="activity-card-content">
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>

                  <a className="activity-link" href={activity.link}>
                    Get More Info
                    <ArrowRight size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {visibleActivities.length === 0 && (
            <div className="empty-search">
              <Search size={28} />
              <h3>No activities found</h3>
              <p>Try a different search or choose another category.</p>

              <button
                className="button button-primary"
                onClick={() => {
                  setSearch("");
                  setFilter("All Activities");
                }}
              >
                View All Activities
              </button>
            </div>
          )}
        </section>

        {/* EVENTS, TOURNAMENTS & ONLINE CLASSES */}

        <section
          className="opportunities-section home-container"
          id="opportunities"
        >
          <div className="centered-heading">
            <span className="section-eyebrow">MORE WAYS TO GROW</span>

            <h2 className="section-heading">
              Learn, Compete & Celebrate
            </h2>

            <p className="section-description">
              Discover exciting events, participate in tournaments,
              and learn new skills through online classes.
            </p>
          </div>

          <div className="opportunities-grid">

            <Link
              to="/events"
              className="opportunity-card opportunity-events"
            >
              <div className="opportunity-icon">
                <CalendarDays size={34} strokeWidth={1.8} />
              </div>

              <span className="opportunity-label">
                EXPLORE & EXPERIENCE
              </span>

              <h3>Events</h3>

              <p>
                Discover exciting workshops, fun activities,
                community gatherings, and special experiences
                for children and families.
              </p>

              <span className="opportunity-link">
                Explore Events
                <ArrowRight size={18} />
              </span>

              <div className="opportunity-decoration opportunity-decoration-one" />
            </Link>

            <Link
              to="/tournaments"
              className="opportunity-card opportunity-tournaments"
            >
              <div className="opportunity-icon">
                <Trophy size={34} strokeWidth={1.8} />
              </div>

              <span className="opportunity-label">
                CHALLENGE YOURSELF
              </span>

              <h3>Tournaments</h3>

              <p>
                Take part in exciting competitions, showcase
                your skills, gain experience, and celebrate
                every achievement.
              </p>

              <span className="opportunity-link">
                Explore Tournaments
                <ArrowRight size={18} />
              </span>

              <div className="opportunity-decoration opportunity-decoration-two" />
            </Link>

            <Link
              to="/online-classes"
              className="opportunity-card opportunity-classes"
            >
              <div className="opportunity-icon">
                <MonitorPlay size={34} strokeWidth={1.8} />
              </div>

              <span className="opportunity-label">
                LEARN FROM ANYWHERE
              </span>

              <h3>Online Classes</h3>

              <p>
                Explore interactive online learning sessions
                led by instructors and develop new skills
                from the comfort of home.
              </p>

              <span className="opportunity-link">
                Explore Classes
                <ArrowRight size={18} />
              </span>

              <div className="opportunity-decoration opportunity-decoration-three" />
            </Link>

          </div>
        </section>

        {/* TESTIMONIALS */}

        <section className="testimonials-section">
          <div className="home-container">
            <div className="centered-heading">
              <span className="section-eyebrow">KIND WORDS</span>

              <h2 className="section-heading">What Parents Say</h2>

              <p className="section-description">
                Hear from families who have experienced learning with us.
              </p>
            </div>

            <div className="review-grid">
              {reviews.map((review) => (
                <article className="review-card" key={review.name}>
                  <div className="review-top">
                    <div className="review-avatar">
                      {review.name.charAt(0)}
                    </div>

                    <div>
                      <h3>{review.name}</h3>
                      <span>{review.count}</span>
                    </div>
                  </div>

                  <div className="review-stars" aria-label="5 out of 5 stars">
                    {[1, 2, 3, 4, 5].map((number) => (
                      <Star key={number} size={15} fill="currentColor" />
                    ))}
                  </div>

                  <p>{review.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}

        <section className="why-section home-container" id="why-us">
          <div className="centered-heading">
            <span className="section-eyebrow">
              THE UNPUZZLE EXPERIENCE
            </span>

            <h2 className="section-heading">Why Choose Us?</h2>

            <p className="section-description">
              More than activities — a place to discover and develop potential.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}

        <section className="home-cta-section">
          <div className="home-container home-cta">
            <div>
              <span className="section-eyebrow">
                YOUR JOURNEY STARTS HERE
              </span>

              <h2>Ready to discover something wonderful?</h2>

              <p>
                Explore our activities and find the right learning experience
                for your child.
              </p>
            </div>

            <a className="button cta-button" href="#activities">
              Explore Activities
              <ArrowRight size={18} />
            </a>
          </div>
        </section>

      </main>

      {/* FOOTER */}

      <footer className="home-footer" id="contact">
        <div className="home-container">
          <div className="footer-main">

            <div className="footer-brand">
              <a href="/" aria-label="Unpuzzle Club home">
                <img
                  src="/assets/unpuzzle-logo.png"
                  alt="Unpuzzle Club"
                  loading="lazy"
                />
              </a>

              <p className="footer-tagline">PLAY • LEARN • GROW</p>

              <p>
                Helping children discover interests, develop skills, and grow
                with confidence.
              </p>
            </div>

            <div className="footer-column">
              <h3>Explore</h3>
              <a href="#activities">Activities</a>
              <a href="#why-us">Why Unpuzzle?</a>
              <a href="/leaderboard">Leaderboard</a>
              <Link to="/events">Events</Link>
              <Link to="/tournaments">Tournaments</Link>
              <Link to="/online-classes">Online Classes</Link>
            </div>

            <div className="footer-column">
              <h3>Get in Touch</h3>
              <a href="mailto:unpuzzleclub@gmail.com">
                unpuzzleclub@gmail.com
              </a>
              <a href="tel:+919036024532">+91 90360 24532</a>
            </div>

            <div className="footer-column footer-social-column">
              <h3>Follow Us</h3>

              <div className="footer-socials">
                <a
                  href="https://www.instagram.com/unpuzzleclub"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <SiInstagram size={21} />
                </a>

                <a
                  href="https://in.linkedin.com/company/unpuzzle-club"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn size={21} />
                </a>

                <a
                  href="https://youtube.com/@unpuzzleclub1"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                >
                  <SiYoutube size={21} />
                </a>
              </div>
            </div>

          </div>

          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} Unpuzzle Club. All rights reserved.
            </p>
            <p>PLAY • LEARN • GROW</p>
          </div>
        </div>
      </footer>

      {/* SIGN IN / SIGN UP MODAL */}

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !authLoading) {
              setModalOpen(false);
              setAuthMessage("");
            }
          }}
        >
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => {
                setModalOpen(false);
                setAuthMessage("");
              }}
              aria-label="Close dialog"
              disabled={authLoading}
            >
              <X size={21} />
            </button>

            <div className="modal-logo">
              <img src="/assets/unpuzzle-logo.png" alt="Unpuzzle Club" />
            </div>

            <h2 id="auth-modal-title">Admin Sign In</h2>

            <p>
              Sign in with your authorized Unpuzzle Club Admin account.
            </p>

            <form onSubmit={handleAdminLogin}>
              <label>
                Email address
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  required
                  autoComplete="username"
                  disabled={authLoading}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={authLoading}
                />
              </label>

              {authMessage && (
                <p
                  role="alert"
                  style={{
                    color: "#d93025",
                    fontSize: "14px",
                    marginTop: "10px",
                  }}
                >
                  {authMessage}
                </p>
              )}

              <button
                type="submit"
                className="button button-primary modal-submit"
                disabled={authLoading}
              >
                {authLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="modal-switch">
              Admin access is restricted to authorized accounts.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
