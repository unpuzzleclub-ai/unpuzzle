import { useState } from "react";
import {
  Menu,
  X,
  Crown,
  ChessKnight,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Brain,
  Users,
  Trophy,
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle,
  Phone,
  CalendarDays,
  Sparkles,
} from "lucide-react";

import "../styles/VishalChessAcademy.css";

const offerings = [
  {
    title: "Offline Chess Classes",
    subtitle: "LEARN AT OUR ACADEMY",
    description:
      "Structured, engaging and interactive chess classes with personal guidance from our coaches.",
    image: "/images/vca/offline-chess.webp",
    color: "green",
    tag: "At Our Academy",
  },
  {
    title: "Online Chess Classes",
    subtitle: "LEARN FROM ANYWHERE",
    description:
      "Learn chess from expert coaches through interactive online sessions and guided practice.",
    image: "/images/vca/online-chess.webp",
    color: "blue",
    tag: "Live Online",
  },
  {
    title: "Monthly Chess Connects",
    subtitle: "COMMUNITY • PRACTICE • PROGRESS",
    description:
      "A fun chess community with puzzles, games, challenges and opportunities to improve.",
    image: "/images/vca/chess-connects.webp",
    color: "purple",
    tag: "Monthly Program",
  },
];

const benefits = [
  {
    icon: <ChessKnight />,
    title: "Structured Curriculum",
    description: "Age and skill-based learning paths.",
    color: "yellow",
  },
  {
    icon: <Brain />,
    title: "Develops Life Skills",
    description: "Focus, patience and critical thinking.",
    color: "blue",
  },
  {
    icon: <Users />,
    title: "Experienced Coaches",
    description: "Passionate coaches focused on student growth.",
    color: "green",
  },
  {
    icon: <Trophy />,
    title: "Regular Practice & Tournaments",
    description: "Build confidence through practical experience.",
    color: "orange",
  },
  {
    icon: <ShieldCheck />,
    title: "Safe & Supportive Environment",
    description: "Every child receives personal attention.",
    color: "purple",
  },
];

const courses = [
  {
    title: "Chess Foundations",
    level: "Beginner",
    description:
      "Learn chess pieces, movements, rules, checkmate patterns and basic strategies.",
    icon: "♟",
  },
  {
    title: "Chess Development",
    level: "Intermediate",
    description:
      "Improve tactical awareness, positional understanding and calculation skills.",
    icon: "♞",
  },
  {
    title: "Advanced Chess Training",
    level: "Advanced",
    description:
      "Develop deeper strategic thinking, opening preparation and advanced endgames.",
    icon: "♛",
  },
  {
    title: "Tournament Preparation",
    level: "Tournament Preparation",
    description:
      "Prepare for competitive chess through practice games, analysis and tournament guidance.",
    icon: "🏆",
  },
];

const uniqueFeatures = [
  "Flexible batch timings",
  "Personalized learning plans",
  "Regular progress reports",
  "Focus on both chess skills and life development",
];

const galleryImages = [
  {
    src: "/images/vca/gallery-1.webp",
    title: "Learning Together",
  },
  {
    src: "/images/vca/gallery-2.webp",
    title: "Practice Sessions",
  },
  {
    src: "/images/vca/gallery-3.webp",
    title: "Tournament Moments",
  },
  {
    src: "/images/vca/gallery-4.webp",
    title: "Our Chess Community",
  },
  {
    src: "/images/vca/gallery-5.webp",
    title: "Celebrating Achievements",
  },
  {
    src: "/images/vca/gallery-6.webp",
    title: "Growing Through Chess",
  },
];

// Replace these sample testimonials with approved parent reviews.
const testimonials = [
  {
    name: "Parent Review",
    student: "Student's Parent",
    review:
      "The structured training and personal attention have made learning chess an enjoyable experience.",
  },
  {
    name: "Parent Review",
    student: "Student's Parent",
    review:
      "The coaches make chess interesting and encourage students to think independently.",
  },
  {
    name: "Parent Review",
    student: "Student's Parent",
    review:
      "We appreciate the supportive learning environment and regular practice opportunities.",
  },
  {
    name: "Parent Review",
    student: "Student's Parent",
    review:
      "A wonderful place for children to learn, practise and develop their chess skills.",
  },
];

const filters = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Tournament Preparation",
];

function SectionHeading({ label, title, description }) {
  return (
    <div className="vca-section-heading">
      <div className="vca-section-eyebrow">
        <span />
        {label}
      </div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export default function VishalChessAcademy() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredCourses =
    activeFilter === "All"
      ? courses
      : courses.filter((course) => course.level === activeFilter);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="vca-site">
      {/* NAVIGATION */}

      <header className="vca-header">
        <div className="vca-nav-container">
          <a href="#home" className="vca-brand" onClick={closeMenu}>
            <div className="vca-brand-icon">
              <img
                src="/images/vca/vca-logo.png"
                alt="Vishal Chess Academy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "block";
                }}
              />
              <ChessKnight className="vca-logo-fallback" />
            </div>

            <div className="vca-brand-text">
              <strong>VISHAL</strong>
              <span>CHESS ACADEMY</span>
              <small>Think · Plan · Win</small>
            </div>
          </a>

          <button
            className="vca-mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <nav className={`vca-nav ${menuOpen ? "open" : ""}`}>
            {[
              ["Home", "#home"],
              ["About Us", "#about"],
              ["Courses", "#courses"],
              ["Offline & Online", "#offerings"],
              ["Monthly Chess Connects", "#connects"],
              ["Testimonials", "#testimonials"],
              ["Contact", "#contact"],
            ].map(([label, link]) => (
              <a key={label} href={link} onClick={closeMenu}>
                {label}
              </a>
            ))}

            <a href="#contact" className="vca-login-btn" onClick={closeMenu}>
              <Users size={17} />
              Sign In / Sign Up
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}

        <section className="vca-hero" id="home">
          <div className="vca-hero-content">
            <span className="vca-hero-label">
              <Crown size={17} />
              VISHAL CHESS ACADEMY
            </span>

            <h1>
              Build Better
              <br />
              Thinkers Through
              <br />
              <span>Chess.</span>
            </h1>

            <p>
              Expert chess coaching for young minds, with a focus on
              logic, confidence and life skills — in a fun and
              supportive environment.
            </p>

            <div className="vca-hero-actions">
              <a href="#contact" className="vca-btn vca-btn-red">
                Book a Free Trial Class
                <ArrowRight size={18} />
              </a>

              <a href="#courses" className="vca-btn vca-btn-outline">
                Explore Courses
              </a>
            </div>

            <div className="vca-hero-highlights">
              <div>
                <Lightbulb />
                <span>Build Logical Thinking</span>
              </div>
              <div>
                <ShieldCheck />
                <span>Boost Confidence</span>
              </div>
              <div>
                <Users />
                <span>Personalized Attention</span>
              </div>
              <div>
                <Star />
                <span>Fun & Engaging Learning</span>
              </div>
            </div>
          </div>

          <div className="vca-hero-visual">
            <img
              src="/images/vca/chess-hero.webp"
              alt="Young student learning chess"
            />

            <div className="vca-hero-image-caption">
              <Crown />
              <span>
                Small Steps.
                <br />
                Big Moves!
              </span>
            </div>

            <div className="vca-floating-badge">
              <ChessKnight />
              <span>Think. Plan. Win.</span>
            </div>
          </div>

          <div className="vca-hero-decoration vca-decoration-one">
            ♟
          </div>
          <div className="vca-hero-decoration vca-decoration-two">
            ✦
          </div>
        </section>

        {/* OFFERINGS */}

        <section className="vca-section vca-offerings" id="offerings">
          <div className="vca-container">
            <SectionHeading
              label="LEARN WITH US"
              title="Our Offerings"
              description="Choose what suits your child best — offline, online or through our Monthly Chess Connects."
            />

            <div className="vca-offering-grid">
              {offerings.map((item, index) => (
                <article
                  className={`vca-offering-card ${item.color}`}
                  key={item.title}
                  id={index === 2 ? "connects" : undefined}
                >
                  <div className="vca-offering-image">
                    <img src={item.image} alt={item.title} />
                    <span className="vca-image-tag">{item.tag}</span>
                  </div>

                  <div className="vca-offering-body">
                    <span className="vca-card-subtitle">
                      {item.subtitle}
                    </span>

                    <h3>{item.title}</h3>
                    <p>{item.description}</p>

                    <a href="#contact" className="vca-card-link">
                      Learn More <ArrowRight size={16} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT / BENEFITS */}

        <section className="vca-section vca-about" id="about">
          <div className="vca-container">
            <div className="vca-benefit-grid">
              {benefits.map((benefit) => (
                <article
                  className={`vca-benefit-card ${benefit.color}`}
                  key={benefit.title}
                >
                  <div className="vca-benefit-icon">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="vca-about-content">
              <div className="vca-about-copy">
                <SectionHeading
                  label="ABOUT OUR ACADEMY"
                  title="More Than Just a Chess Move"
                  description="Nurturing young minds through chess since 2020."
                />

                <p>
                  At Vishal Chess Academy, we believe chess is more
                  than a game. It is an opportunity for children to
                  develop patience, logical thinking, discipline and
                  confidence.
                </p>

                <p>
                  Through structured learning, guided practice and
                  supportive coaching, we help every student enjoy
                  the journey of learning chess.
                </p>

                <a href="#contact" className="vca-btn vca-btn-red">
                  Know More About Us <ArrowRight size={17} />
                </a>
              </div>

              <div className="vca-about-visual">
                <img
                  src="/images/vca/about-chess.webp"
                  alt="Chess coaching at Vishal Chess Academy"
                />

                <div className="vca-about-sticker">
                  <Crown />
                  <strong>Think</strong>
                  <strong>Plan</strong>
                  <strong>Win!</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COURSES */}

        <section className="vca-section vca-courses" id="courses">
          <div className="vca-container">
            <div className="vca-course-layout">
              <div className="vca-course-main">
                <SectionHeading
                  label="FIND YOUR LEVEL"
                  title="Our Courses"
                  description="From basics to advanced, we have the right learning path for every chess enthusiast."
                />

                <div className="vca-course-filters">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      className={
                        activeFilter === filter ? "active" : ""
                      }
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="vca-course-grid">
                  {filteredCourses.map((course, index) => (
                    <article
                      className="vca-course-card"
                      key={course.title}
                    >
                      <div className={`vca-course-symbol symbol-${index}`}>
                        {course.icon}
                      </div>

                      <span className="vca-course-level">
                        {course.level}
                      </span>

                      <h3>{course.title}</h3>
                      <p>{course.description}</p>

                      <a href="#contact">
                        Enquire Now <ChevronRight size={16} />
                      </a>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="vca-unique-card">
                <div className="vca-unique-icon">
                  <Crown />
                </div>

                <h3>What Makes Us Different?</h3>

                <p>
                  Every child learns differently. Our approach
                  focuses on individual growth and meaningful progress.
                </p>

                <ul>
                  {uniqueFeatures.map((feature) => (
                    <li key={feature}>
                      <CheckCircle size={17} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a href="#contact">
                  Discover Our Approach <ArrowRight size={16} />
                </a>
              </aside>
            </div>
          </div>
        </section>

        {/* GALLERY */}

        <section className="vca-section vca-gallery" id="gallery">
          <div className="vca-container">
            <SectionHeading
              label="OUR MEMORIES"
              title="Moments That Make Us"
              description="A glimpse into our learning sessions, chess events and academy community."
            />

            <div className="vca-gallery-grid">
              {galleryImages.map((image, index) => (
                <div
                  className={`vca-gallery-item gallery-${index + 1}`}
                  key={image.src}
                >
                  <img src={image.src} alt={image.title} />
                  <div className="vca-gallery-overlay">
                    <span>{image.title}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="vca-gallery-bottom">
              <Sparkles />
              <span>Every move creates a memory!</span>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}

        <section
          className="vca-section vca-testimonials"
          id="testimonials"
        >
          <div className="vca-container">
            <SectionHeading
              label="PARENTS' EXPERIENCES"
              title="What Parents Say About Us"
              description="Real experiences and happy learning journeys."
            />

            <div className="vca-testimonial-grid">
              {testimonials.map((item, index) => (
                <article
                  className="vca-testimonial-card"
                  key={index}
                >
                  <div className="vca-review-header">
                    <div className="vca-review-avatar">
                      <Users />
                    </div>

                    <div>
                      <h3>{item.name}</h3>
                      <span>{item.student}</span>
                    </div>
                  </div>

                  <div className="vca-review-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} fill="currentColor" />
                    ))}
                  </div>

                  <p>"{item.review}"</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}

        <section className="vca-final-cta">
          <div className="vca-container vca-cta-content">
            <div>
              <span className="vca-cta-eyebrow">
                <Crown /> YOUR CHILD'S CHESS JOURNEY STARTS HERE
              </span>

              <h2>Ready to Make Your Move?</h2>

              <p>
                Join Vishal Chess Academy and give your child the
                opportunity to think smarter and grow stronger.
              </p>
            </div>

            <a href="#contact" className="vca-btn vca-btn-yellow">
              Book a Free Trial Class <ArrowRight size={18} />
            </a>

            <div className="vca-cta-chess-decoration">
              ♟ ♜ ♞ ♛ ♚
            </div>
          </div>
        </section>
      </main>

      {/* CONTACT & FOOTER */}

      <footer className="vca-footer" id="contact">
        <div className="vca-container">
          <div className="vca-footer-main">
            <div className="vca-footer-brand">
              <div className="vca-brand">
                <div className="vca-brand-icon">
                  <img
                    src="/images/vca/vca-logo.png"
                    alt="Vishal Chess Academy"
                  />
                </div>

                <div className="vca-brand-text">
                  <strong>VISHAL</strong>
                  <span>CHESS ACADEMY</span>
                  <small>Think · Plan · Win</small>
                </div>
              </div>

              <p>
                Nurturing young minds through chess with structured
                coaching, meaningful practice and a supportive
                learning environment.
              </p>
            </div>

            <div className="vca-footer-links">
              <h3>Explore</h3>
              <a href="#about">About Us</a>
              <a href="#courses">Our Courses</a>
              <a href="#offerings">Offline & Online</a>
              <a href="#connects">Monthly Chess Connects</a>
              <a href="#gallery">Gallery</a>
            </div>

            <div className="vca-footer-links">
              <h3>Get In Touch</h3>
              <a href="#contact">
                <MapPin size={16} /> Our Academy Locations
              </a>
              <a href="#contact">
                <Phone size={16} /> Contact Us
              </a>
              <a href="#contact">
                <CalendarDays size={16} /> Book a Trial Class
              </a>
            </div>

            <div className="vca-footer-social">
              <h3>Follow Our Journey</h3>

              {/* <div className="vca-social-icons">
                <a href="#" aria-label="Instagram">
                  <Instagram />
                </a>
                <a href="#" aria-label="YouTube">
                  <Youtube />
                </a>
                <a href="#" aria-label="Facebook">
                  <Facebook />
                </a>
              </div> */}

              <span>Think. Plan. Win.</span>
            </div>
          </div>

          <div className="vca-footer-bottom">
            <span>© {new Date().getFullYear()} Vishal Chess Academy.</span>
            <span>All rights reserved.</span>
            <div>
              <a href="#contact">Privacy Policy</a>
              <a href="#contact">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
