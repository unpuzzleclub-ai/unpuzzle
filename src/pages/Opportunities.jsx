
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Trophy,
  MonitorPlay,
  Users,
  X,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import "../styles/Opportunities.css";

// ======================================
// OPPORTUNITY CONTEXT
// ======================================

const OpportunityContext = createContext(null);

const initialData = {
  events: [],
  tournaments: [],
  "online-classes": [],
};

// Convert database records into UI records.

function mapOpportunity(row) {
  const image = row.image_path
    ? supabase.storage
        .from("opportunity-posters")
        .getPublicUrl(row.image_path).data.publicUrl
    : "";

  return {
    id: row.id,
    type: row.type,
    title: row.title || "",
    description: row.description || "",
    date: row.date || "",
    time: row.time || "",
    venue: row.venue || "",
    fee: row.fee || "",
    deadline: row.deadline || "",
    instructor: row.instructor || "",
    duration: row.duration || "",
    platform: row.platform || "",
    format: row.format || "",
    category: row.category || "",
    prizes: row.prizes || "",
    image,
    image_path: row.image_path || null,
    status: row.status,
  };
}

// ======================================
// OPPORTUNITY PROVIDER
// ======================================

export function OpportunityProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Load opportunities and check Admin authorization.

  useEffect(() => {
    let active = true;

    const loadOpportunities = async (session) => {
      if (!active) return;

      setLoading(true);
      setLoadError("");
      setIsAdmin(false);

      let admin = false;

      if (session?.user) {
        const { data: adminResult, error: adminError } =
          await supabase.rpc("is_admin");

        if (!adminError && adminResult === true) {
          admin = true;
        }
      }

      if (!active) return;

      setIsAdmin(admin);

      let query = supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      // Public visitors only load published opportunities.
      // Database RLS also enforces this restriction.

      if (!admin) {
        query = query.eq("status", "Published");
      }

      const { data: rows, error } = await query;

      if (!active) return;

      if (error) {
        console.error("Opportunity loading error:", error);
        setLoadError("Unable to load opportunities. Please refresh.");
        setData(initialData);
      } else {
        const nextData = {
          events: [],
          tournaments: [],
          "online-classes": [],
        };

        (rows || []).forEach((row) => {
          if (nextData[row.type]) {
            nextData[row.type].push(mapOpportunity(row));
          }
        });

        setData(nextData);
      }

      setLoading(false);
    };

    const initialize = async () => {
      const { data: sessionData } =
        await supabase.auth.getSession();

      if (!active) return;

      await loadOpportunities(sessionData.session);
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      Promise.resolve().then(() => {
        if (active) {
          loadOpportunities(session);
        }
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ======================================
  // ADD OPPORTUNITY
  // ======================================

  const addOpportunity = async (type, item) => {
    if (!isAdmin) {
      throw new Error("Only an authorized Admin can add opportunities.");
    }

    let imagePath = null;

    // Upload poster image.

    if (item.imageFile) {
      const file = item.imageFile;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${type}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("opportunity-posters")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      imagePath = filePath;
    }

    const record = {
      type,
      title: item.title,
      description: item.description,
      date: item.date || null,
      time: item.time || null,
      venue: item.venue || null,
      fee: item.fee || null,
      deadline: item.deadline || null,
      instructor: item.instructor || null,
      duration: item.duration || null,
      platform: item.platform || null,
      format: item.format || null,
      category: item.category || null,
      prizes: item.prizes || null,
      image_path: imagePath,
      status: item.status,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("opportunities")
      .insert(record)
      .select()
      .single();

    if (insertError) {
      if (imagePath) {
        await supabase.storage
          .from("opportunity-posters")
          .remove([imagePath]);
      }

      throw insertError;
    }

    const savedItem = mapOpportunity(inserted);

    setData((previous) => ({
      ...previous,
      [type]: [savedItem, ...previous[type]],
    }));

    return savedItem;
  };

  // ======================================
  // UPDATE OPPORTUNITY
  // ======================================

  const updateOpportunity = async (id, updates) => {
    if (!isAdmin) {
      throw new Error("Admin access required.");
    }

    const { data: updated, error } = await supabase
      .from("opportunities")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const savedItem = mapOpportunity(updated);

    setData((previous) => ({
      ...previous,
      [savedItem.type]: previous[savedItem.type].map((item) =>
        item.id === id ? savedItem : item
      ),
    }));

    return savedItem;
  };

  // ======================================
  // DELETE OPPORTUNITY
  // ======================================

  const deleteOpportunity = async (item) => {
    if (!isAdmin) {
      throw new Error("Admin access required.");
    }

    const { error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", item.id);

    if (error) {
      throw error;
    }

    // Delete associated poster after database deletion.

    if (item.image_path) {
      const { error: storageError } = await supabase.storage
        .from("opportunity-posters")
        .remove([item.image_path]);

      if (storageError) {
        console.error("Poster deletion failed:", storageError);
      }
    }

    setData((previous) => ({
      ...previous,
      [item.type]: previous[item.type].filter(
        (entry) => entry.id !== item.id
      ),
    }));
  };

  return (
    <OpportunityContext.Provider
      value={{
        data,
        isAdmin,
        loading,
        loadError,
        addOpportunity,
        updateOpportunity,
        deleteOpportunity,
      }}
    >
      {children}
    </OpportunityContext.Provider>
  );
}

// ======================================
// PAGE CONFIGURATION
// ======================================

const pageConfig = {
  events: {
    title: "Events",
    singular: "Event",
    action: "Register Now",
    eyebrow: "EXPLORE & EXPERIENCE",
    description:
      "Discover exciting workshops, activities, community gatherings and special experiences.",
    icon: CalendarDays,
    accent: "events",
  },

  tournaments: {
    title: "Tournaments",
    singular: "Tournament",
    action: "Register Now",
    eyebrow: "CHALLENGE YOURSELF",
    description:
      "Compete, gain experience, showcase your skills and celebrate every achievement.",
    icon: Trophy,
    accent: "tournaments",
  },

  "online-classes": {
    title: "Online Classes",
    singular: "Class",
    action: "Enroll Now",
    eyebrow: "LEARN FROM ANYWHERE",
    description:
      "Explore interactive online classes led by instructors and learn new skills from anywhere.",
    icon: MonitorPlay,
    accent: "classes",
  },
};

// ======================================
// DATE FORMATTER
// ======================================

function formatDate(value) {
  if (!value) return "Date to be announced";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

// ======================================
// ADD OPPORTUNITY MODAL
// ======================================

function AddOpportunityModal({ type, onClose, onAdd }) {
  const config = pageConfig[type];

  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const form = new FormData(event.currentTarget);

    const getValue = (name) => {
      return (form.get(name) || "").toString().trim();
    };

    const item = {
      title: getValue("title"),
      description: getValue("description"),
      date: getValue("date"),
      time: getValue("time"),
      venue: getValue("venue"),
      fee: getValue("fee"),
      deadline: getValue("deadline"),
      instructor: getValue("instructor"),
      duration: getValue("duration"),
      platform: getValue("platform"),
      format: getValue("format"),
      category: getValue("category"),
      prizes: getValue("prizes"),
      imageFile,
      status: form.get("publish") ? "Published" : "Draft",
    };

    if (!item.title) return;

    try {
      setSaving(true);
      setErrorMessage("");

      await onAdd(item);
      onClose();
    } catch (error) {
      console.error("Unable to save opportunity:", error);

      setErrorMessage(
        error.message || "Unable to save. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="uc-op-modal-overlay" onMouseDown={onClose}>
      <section
        className="uc-op-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="uc-op-modal-header">
          <div>
            <span className="uc-op-small-label">
              ADMIN MANAGEMENT
            </span>

            <h2>Add New {config.singular}</h2>

            <p>Enter the details below.</p>
          </div>

          <button
            type="button"
            className="uc-op-close"
            onClick={onClose}
            disabled={saving}
          >
            <X size={21} />
          </button>
        </div>

        <form className="uc-op-form" onSubmit={handleSubmit}>
          {/* POSTER IMAGE */}

          <label className="uc-op-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
            />

            {imagePreview ? (
              <img src={imagePreview} alt="Preview" />
            ) : (
              <>
                <ImagePlus size={30} />
                <strong>Upload {config.singular} Image</strong>
                <span>Select an image from your device (max 5 MB)</span>
              </>
            )}
          </label>

          {/* BASIC DETAILS */}

          <label>
            {config.singular} Title *
            <input
              name="title"
              placeholder={`Enter ${config.singular} title`}
              required
            />
          </label>

          <label>
            Description *
            <textarea
              name="description"
              rows="4"
              placeholder="Enter description"
              required
            />
          </label>

          <div className="uc-op-form-two">
            <label>
              Date
              <input type="date" name="date" />
            </label>

            <label>
              Time
              <input type="time" name="time" />
            </label>
          </div>

          {/* EVENTS AND TOURNAMENTS */}

          {type !== "online-classes" && (
            <label>
              Venue
              <input
                name="venue"
                placeholder="Enter location"
              />
            </label>
          )}

          {/* ONLINE CLASSES */}

          {type === "online-classes" && (
            <>
              <label>
                Instructor
                <input
                  name="instructor"
                  placeholder="Instructor name"
                />
              </label>

              <div className="uc-op-form-two">
                <label>
                  Duration
                  <input
                    name="duration"
                    placeholder="60 minutes"
                  />
                </label>

                <label>
                  Platform
                  <input
                    name="platform"
                    placeholder="Zoom / Google Meet"
                  />
                </label>
              </div>
            </>
          )}

          {/* TOURNAMENT DETAILS */}

          {type === "tournaments" && (
            <>
              <label>
                Tournament Format
                <input
                  name="format"
                  placeholder="15 minutes + 5 seconds"
                />
              </label>

              <label>
                Categories
                <input
                  name="category"
                  placeholder="Under 8, Under 10, Open"
                />
              </label>

              <label>
                Prizes
                <input
                  name="prizes"
                  placeholder="Enter prize details"
                />
              </label>
            </>
          )}

          {/* FEE AND DEADLINE */}

          <div className="uc-op-form-two">
            <label>
              Fee
              <input name="fee" placeholder="₹500" />
            </label>

            <label>
              Registration Deadline
              <input type="date" name="deadline" />
            </label>
          </div>

          {/* PUBLISH OPTION */}

          <label className="uc-op-publish-option">
            <input
              type="checkbox"
              name="publish"
              defaultChecked
            />
            Publish immediately
          </label>

          {errorMessage && (
            <p role="alert" className="uc-op-error-message">
              {errorMessage}
            </p>
          )}

          <div className="uc-op-modal-actions">
            <button
              type="button"
              className="uc-op-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="uc-op-primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : `Add ${config.singular}`}
              {!saving && <Plus size={17} />}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ======================================
// OPPORTUNITY LISTING PAGE
// ======================================

export function OpportunityListingPage({ type }) {
  const context = useContext(OpportunityContext);

  const [showAddForm, setShowAddForm] = useState(false);

  if (!pageConfig[type] || !context) {
    return <div>Page not found.</div>;
  }

  const config = pageConfig[type];
  const PageIcon = config.icon;

  // Admin sees drafts and published items.
  // Public visitors only see published items.

  const items = context.isAdmin
    ? context.data[type] || []
    : (context.data[type] || []).filter(
        (item) => item.status === "Published"
      );

  const handleAdd = async (item) => {
    await context.addOpportunity(type, item);
  };

  const handleStatusChange = async (item) => {
    try {
      await context.updateOpportunity(item.id, {
        status:
          item.status === "Published"
            ? "Draft"
            : "Published",
      });
    } catch (error) {
      console.error("Status update failed:", error);
      alert(error.message || "Unable to update status.");
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${item.title}"?`
    );

    if (!confirmed) return;

    try {
      await context.deleteOpportunity(item);
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.message || "Unable to delete opportunity.");
    }
  };

  return (
    <main className="uc-op-page">
      {/* HEADER */}

      <header className="uc-op-header">
        <Link to="/" className="uc-op-brand">
          Unpuzzle Club
        </Link>

        <Link to="/" className="uc-op-back">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </header>

      {/* HERO */}

      <section className={`uc-op-hero ${config.accent}`}>
        <div className={`uc-op-hero-icon ${config.accent}`}>
          <PageIcon size={37} />
        </div>

        <span className="uc-op-eyebrow">
          {config.eyebrow}
        </span>

        <h1>{config.title}</h1>

        <p>{config.description}</p>
      </section>

      {/* LISTING */}

      <section className="uc-op-list">
        <div className="uc-op-list-heading">
          <div>
            <span className="uc-op-small-label">
              UNPUZZLE CLUB
            </span>

            <h2>All {config.title}</h2>

            <p>Find the right opportunity and join us.</p>
          </div>

          <span className="uc-op-count">
            {context.isAdmin
              ? `${items.length} total`
              : `${items.length} available`}
          </span>
        </div>

        {/* LOADING */}

        {context.loading ? (
          <div className="uc-op-empty-state">
            <p>Loading {config.title.toLowerCase()}...</p>
          </div>
        ) : context.loadError ? (
          <div className="uc-op-empty-state">
            <h3>Unable to load opportunities</h3>
            <p>{context.loadError}</p>
          </div>
        ) : items.length > 0 ? (
          <div className="uc-op-grid">
            {items.map((item) => (
              <article className="uc-op-card" key={item.id}>
                {/* POSTER */}

                <div className={`uc-op-card-banner ${config.accent}`}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <PageIcon size={42} />
                  )}
                </div>

                <div className="uc-op-card-body">
                  <span className="uc-op-status">
                    {config.singular}
                  </span>

                  {/* ADMIN CONTROLS */}

                  {context.isAdmin && (
                    <div className="uc-op-admin-actions">
                      <span
                        className={
                          item.status === "Published"
                            ? "uc-op-admin-published"
                            : "uc-op-admin-draft"
                        }
                      >
                        {item.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item)}
                      >
                        {item.status === "Published"
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>

                  {/* DETAILS */}

                  <div className="uc-op-details">
                    {item.date && (
                      <div>
                        <CalendarDays size={16} />
                        <span>{formatDate(item.date)}</span>
                      </div>
                    )}

                    {item.time && (
                      <div>
                        <Clock size={16} />
                        <span>{item.time.slice(0, 5)}</span>
                      </div>
                    )}

                    {item.venue && (
                      <div>
                        <MapPin size={16} />
                        <span>{item.venue}</span>
                      </div>
                    )}

                    {item.fee && (
                      <div>
                        <Users size={16} />
                        <span>{item.fee}</span>
                      </div>
                    )}

                    {item.instructor && (
                      <div>
                        <Users size={16} />
                        <span>Instructor: {item.instructor}</span>
                      </div>
                    )}

                    {item.duration && (
                      <div>
                        <Clock size={16} />
                        <span>{item.duration}</span>
                      </div>
                    )}

                    {item.platform && (
                      <div>
                        <MonitorPlay size={16} />
                        <span>{item.platform}</span>
                      </div>
                    )}

                    {item.format && (
                      <div>
                        <Trophy size={16} />
                        <span>{item.format}</span>
                      </div>
                    )}

                    {item.category && (
                      <div>
                        <Users size={16} />
                        <span>{item.category}</span>
                      </div>
                    )}

                    {item.prizes && (
                      <div>
                        <Trophy size={16} />
                        <span>{item.prizes}</span>
                      </div>
                    )}
                  </div>

                  {item.deadline && (
                    <p className="uc-op-deadline">
                      Registration deadline: {formatDate(item.deadline)}
                    </p>
                  )}

                  {/* REGISTRATION BUTTON */}

                  {item.status === "Published" ? (
                    type === "tournaments" ? (
                      <Link
                        to={`/tournaments/${item.id}/register`}
                        state={{ tournament: item }}
                        className="uc-op-primary-button"
                      >
                        Register Now
                        <ArrowRight size={17} />
                      </Link>
                    ) : (
                      <Link
                        to={`/${type}/${item.id}/register`}
                        className="uc-op-primary-button"
                      >
                        {config.action}
                        <ArrowRight size={17} />
                      </Link>
                    )
                  ) : (
                    context.isAdmin && (
                      <p className="uc-op-form-note">
                        This item is a draft and is not visible to visitors.
                      </p>
                    )
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="uc-op-empty-state">
            <div className={`uc-op-empty-icon ${config.accent}`}>
              <PageIcon size={32} />
            </div>

            <h3>
              No {config.title.toLowerCase()} published yet
            </h3>

            <p>
              New opportunities will appear here once Unpuzzle Club
              publishes them.
            </p>
          </div>
        )}
      </section>

      {/* ADMIN-ONLY ADD BUTTON */}

      {context.isAdmin && (
        <button
          type="button"
          className="uc-op-add-button"
          onClick={() => setShowAddForm(true)}
          aria-label={`Add ${config.singular}`}
          title={`Add ${config.singular}`}
        >
          <Plus size={36} strokeWidth={2.5} />
        </button>
      )}

      {/* ADD MODAL */}

      {showAddForm && context.isAdmin && (
        <AddOpportunityModal
          type={type}
          onClose={() => setShowAddForm(false)}
          onAdd={handleAdd}
        />
      )}
    </main>
  );
}

// ======================================
// EVENTS / ONLINE CLASSES REGISTRATION
// ======================================

export function OpportunityRegistrationPage() {
  const { type, itemId } = useParams();

  const navigate = useNavigate();

  const context = useContext(OpportunityContext);

  const [submitted, setSubmitted] = useState(false);

  const config = pageConfig[type];

  const item = context?.data[type]?.find(
    (entry) => entry.id === itemId
  );

  if (!config || !item || !context || type === "tournaments") {
    return (
      <main className="uc-op-page">
        <div className="uc-op-empty-state">
          <h2>Opportunity not found</h2>

          <Link to="/" className="uc-op-primary-button">
            Back to Homepage
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="uc-op-page">
        <section className="uc-op-success">
          <CheckCircle2 size={54} />

          <h1>Form submitted!</h1>

          <p>
            This is currently a frontend demonstration.
            Your details have not been saved or sent.
            Supabase registration integration is still required.
          </p>

          <button
            type="button"
            className="uc-op-primary-button"
            onClick={() => navigate(`/${type}`)}
          >
            Back to {config.title}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="uc-op-page">
      <header className="uc-op-header">
        <Link to="/" className="uc-op-brand">
          Unpuzzle Club
        </Link>

        <Link to={`/${type}`} className="uc-op-back">
          <ArrowLeft size={16} />
          Back to {config.title}
        </Link>
      </header>

      <section className="uc-op-form-section">
        <span className="uc-op-eyebrow">
          JOIN THE EXPERIENCE
        </span>

        <h1>{config.action}</h1>

        <p className="uc-op-form-intro">
          {item.title}
        </p>

        <form className="uc-op-form" onSubmit={handleSubmit}>
          <div className="uc-op-form-event">
            <strong>{item.title}</strong>

            {item.date && <span>{formatDate(item.date)}</span>}

            {item.fee && <span>{item.fee}</span>}
          </div>

          <h3>Student Details</h3>

          <label>
            Student Name *
            <input
              name="studentName"
              placeholder="Enter student's full name"
              required
            />
          </label>

          <label>
            Date of Birth *
            <input
              type="date"
              name="dob"
              required
            />
          </label>

          <h3>Parent / Guardian Details</h3>

          <label>
            Parent / Guardian Name *
            <input
              name="parentName"
              placeholder="Enter parent or guardian name"
              required
            />
          </label>

          <label>
            Mobile Number *
            <input
              type="tel"
              name="mobile"
              placeholder="10-digit mobile number"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
            />
          </label>

          <label>
            Additional Information
            <textarea
              name="notes"
              rows="3"
              placeholder="Any additional information"
            />
          </label>

          <button
            type="submit"
            className="uc-op-primary-button uc-op-submit"
          >
            Submit {type === "online-classes" ? "Enrollment" : "Registration"}
            <ArrowRight size={17} />
          </button>

          <p className="uc-op-form-note">
            Registration details are not saved yet.
            Supabase integration will enable storage.
          </p>
        </form>
      </section>
    </main>
  );
}

export default OpportunityListingPage;
