
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  MonitorPlay,
  ClipboardList,
  GraduationCap,
  Settings,
  LogOut,
  ShieldCheck,
  ArrowUpRight,
  Menu,
  X,
  Users,
  Clock,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "../styles/AdminDashboard.css";

// ======================================
// ADMIN PROTECTED ROUTE
// ======================================

export function ProtectedAdminRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          if (active) {
            setAuthorized(false);
            setChecking(false);
          }
          return;
        }

        const { data, error } = await supabase.rpc("is_admin");

        if (active) {
          setAuthorized(!error && data === true);
          setChecking(false);
        }
      } catch (error) {
        console.error("Admin verification failed:", error);

        if (active) {
          setAuthorized(false);
          setChecking(false);
        }
      }
    };

    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="admin-auth-loading">
        <div className="admin-spinner" />
        <p>Verifying administrator access...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="admin-access-denied">
        <ShieldCheck size={42} />
        <h2>Access Restricted</h2>
        <p>You need administrator access to view this page.</p>
        <Link to="/" className="admin-primary-button">
          Return to Website
        </Link>
      </div>
    );
  }

  return children;
}

// ======================================
// SIDEBAR NAVIGATION
// ======================================

const mainNavigation = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Registrations",
    path: "/admin/registrations",
    icon: ClipboardList,
  },
];

const managementNavigation = [
  {
    label: "Events",
    path: "/events",
    icon: CalendarDays,
  },
  {
    label: "Tournaments",
    path: "/tournaments",
    icon: Trophy,
  },
  {
    label: "Online Classes",
    path: "/online-classes",
    icon: MonitorPlay,
  },
];

// ======================================
// ADMIN DASHBOARD
// ======================================

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    registrations: 0,
    events: 0,
    tournaments: 0,
    onlineClasses: 0,
  });

  const [adminEmail, setAdminEmail] = useState("");

  // ----------------------------------
  // FETCH DASHBOARD DATA
  // ----------------------------------

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const [
        registrationsResult,
        eventsResult,
        tournamentsResult,
        classesResult,
        userResult,
      ] = await Promise.all([
        supabase
          .from("tournament_registrations")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })
          .eq("type", "events"),

        supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })
          .eq("type", "tournaments"),

        supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })
          .eq("type", "online-classes"),

        supabase.auth.getUser(),
      ]);

      const errors = [
        registrationsResult.error,
        eventsResult.error,
        tournamentsResult.error,
        classesResult.error,
      ].filter(Boolean);

      if (errors.length) {
        console.error("Dashboard data errors:", errors);
      }

      setStats({
        registrations: registrationsResult.count ?? 0,
        events: eventsResult.count ?? 0,
        tournaments: tournamentsResult.count ?? 0,
        onlineClasses: classesResult.count ?? 0,
      });

      setAdminEmail(userResult.data?.user?.email ?? "");
    } catch (error) {
      console.error("Dashboard loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // ----------------------------------
  // SIGN OUT
  // ----------------------------------

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/");
  };

  // ----------------------------------
  // SIDEBAR
  // ----------------------------------

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-layout">
      {menuOpen && (
        <button
          type="button"
          className="admin-mobile-overlay"
          aria-label="Close navigation"
          onClick={closeMenu}
        />
      )}

      <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-top">
          <Link to="/" className="admin-brand" onClick={closeMenu}>
            <div className="admin-brand-icon">U</div>

            <div>
              <strong>Unpuzzle Club</strong>
              <span>ADMINISTRATION</span>
            </div>
          </Link>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-sidebar-content">
          <p className="admin-nav-heading">WORKSPACE</p>

          <nav className="admin-navigation">
            {mainNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <p className="admin-nav-heading admin-nav-second-heading">
            WEBSITE MANAGEMENT
          </p>

          <nav className="admin-navigation">
            {managementNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  <ArrowUpRight size={14} className="admin-nav-external" />
                </NavLink>
              );
            })}
          </nav>

          <p className="admin-nav-heading admin-nav-second-heading">
            MORE
          </p>

          <div className="admin-navigation">
            <div className="admin-nav-link disabled">
              <GraduationCap size={19} />
              <span>Students</span>
              <small>SOON</small>
            </div>

            <div className="admin-nav-link disabled">
              <Settings size={19} />
              <span>Settings</span>
              <small>SOON</small>
            </div>
          </div>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              <ShieldCheck size={19} />
            </div>

            <div className="admin-user-details">
              <strong>Administrator</strong>
              <span title={adminEmail}>
                {adminEmail || "Admin account"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-signout-button"
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ==================================
          MAIN CONTENT
      ================================== */}

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div>
              <span className="admin-breadcrumb">Workspace /</span>
              <strong>Dashboard</strong>
            </div>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-status">
              <span className="admin-status-dot" />
              System Active
            </span>

            <button
              type="button"
              className="admin-refresh-button"
              onClick={loadDashboard}
              disabled={loading}
              title="Refresh dashboard"
            >
              <RefreshCw
                size={17}
                className={loading ? "admin-refreshing" : ""}
              />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          {/* WELCOME */}

          <section className="admin-welcome">
            <div>
              <span className="admin-eyebrow">
                UNPUZZLE CLUB MANAGEMENT
              </span>

              <h1>Welcome back, Admin.</h1>

              <p>
                Manage your activities, registrations and platform
                operations from one place.
              </p>
            </div>

            <div className="admin-welcome-icon">
              <ShieldCheck size={34} />
            </div>
          </section>

          {/* OVERVIEW */}

          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <h2>Overview</h2>
                <p>A quick summary of your platform.</p>
              </div>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-icon purple">
                    <ClipboardList size={21} />
                  </span>
                  <span className="admin-stat-label">REGISTRATIONS</span>
                </div>

                <strong>
                  {loading ? "—" : stats.registrations}
                </strong>

                <span className="admin-stat-description">
                  Tournament submissions
                </span>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-icon orange">
                    <CalendarDays size={21} />
                  </span>
                  <span className="admin-stat-label">EVENTS</span>
                </div>

                <strong>{loading ? "—" : stats.events}</strong>

                <span className="admin-stat-description">
                  Total events created
                </span>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-icon blue">
                    <Trophy size={21} />
                  </span>
                  <span className="admin-stat-label">TOURNAMENTS</span>
                </div>

                <strong>{loading ? "—" : stats.tournaments}</strong>

                <span className="admin-stat-description">
                  Total tournaments created
                </span>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-icon green">
                    <MonitorPlay size={21} />
                  </span>
                  <span className="admin-stat-label">ONLINE CLASSES</span>
                </div>

                <strong>{loading ? "—" : stats.onlineClasses}</strong>

                <span className="admin-stat-description">
                  Total online classes created
                </span>
              </div>
            </div>
          </section>

          {/* MANAGEMENT */}

          <section className="admin-section">
            <div className="admin-section-heading">
              <div>
                <h2>Manage Your Platform</h2>
                <p>Access and manage your website sections.</p>
              </div>
            </div>

            <div className="admin-management-grid">
              <Link to="/events" className="admin-management-card">
                <div className="admin-management-icon orange">
                  <CalendarDays size={23} />
                </div>

                <div className="admin-management-copy">
                  <h3>Events</h3>
                  <p>
                    Create and manage events, registrations and event
                    information.
                  </p>
                </div>

                <span className="admin-management-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </Link>

              <Link to="/tournaments" className="admin-management-card">
                <div className="admin-management-icon blue">
                  <Trophy size={23} />
                </div>

                <div className="admin-management-copy">
                  <h3>Tournaments</h3>
                  <p>
                    Publish tournaments and manage tournament details.
                  </p>
                </div>

                <span className="admin-management-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </Link>

              <Link to="/online-classes" className="admin-management-card">
                <div className="admin-management-icon green">
                  <MonitorPlay size={23} />
                </div>

                <div className="admin-management-copy">
                  <h3>Online Classes</h3>
                  <p>
                    Organise online sessions and manage class information.
                  </p>
                </div>

                <span className="admin-management-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </Link>

              <Link
                to="/admin/registrations"
                className="admin-management-card"
              >
                <div className="admin-management-icon purple">
                  <ClipboardList size={23} />
                </div>

                <div className="admin-management-copy">
                  <h3>Tournament Registrations</h3>
                  <p>
                    Review student entries and verify payment screenshots.
                  </p>
                </div>

                <span className="admin-management-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </Link>
            </div>
          </section>

          {/* QUICK ACCESS */}

          <section className="admin-quick-panel">
            <div className="admin-quick-icon">
              <Clock size={22} />
            </div>

            <div className="admin-quick-copy">
              <h3>Keep your platform updated</h3>
              <p>
                Publish new activities and review registrations regularly
                to keep your community informed.
              </p>
            </div>

            <Link to="/" className="admin-website-link">
              View Website
              <ArrowUpRight size={17} />
            </Link>
          </section>

          <footer className="admin-footer">
            <span>© {new Date().getFullYear()} Unpuzzle Club</span>
            <span>PLAY • LEARN • GROW</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
