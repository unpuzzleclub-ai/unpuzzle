
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
  FileText,
  Download,
  Eye,
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

const STORAGE_BUCKET = "opportunity-posters";

function getPublicUrl(path) {
  if (!path) return "";

  return supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path).data.publicUrl;
}

function mapOpportunity(row) {
  const brochureUrl = getPublicUrl(row.brochure_path);

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
    category_prices: row.category_prices || {},
    prizes: row.prizes || "",
    image: getPublicUrl(row.image_path),
    image_path: row.image_path || null,
    brochure: brochureUrl,
    brochureDownload: brochureUrl
      ? `${brochureUrl}?download=${encodeURIComponent(
          row.brochure_path.split("/").pop()
        )}`
      : "",
    brochure_path: row.brochure_path || null,
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
        if (active) loadOpportunities(session);
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
    let brochurePath = null;

    const storage = supabase.storage.from(STORAGE_BUCKET);

    try {
      // Upload poster image.

      if (item.imageFile) {
        const file = item.imageFile;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");

        imagePath = `${type}/${crypto.randomUUID()}-${safeName}`;

        const { error } = await storage.upload(imagePath, file, {
          contentType: file.type,
          upsert: false,
        });

        if (error) throw error;
      }

      // Upload PDF brochure.

      if (type === "tournaments" && item.brochureFile) {
        const file = item.brochureFile;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");

        brochurePath = `brochures/${crypto.randomUUID()}-${safeName}`;

        const { error } = await storage.upload(
          brochurePath,
          file,
          {
            contentType: "application/pdf",
            upsert: false,
          }
        );

        if (error) throw error;
      }

      const record = {
        type,
        title: item.title,
        description: item.description,
        date: item.date || null,
        time: item.time || null,
        venue: item.venue || null,
        fee: type === "tournaments" ? null : item.fee || null,
        deadline: item.deadline || null,
        instructor: item.instructor || null,
        duration: item.duration || null,
        platform: item.platform || null,
        format: item.format || null,
        category: item.category || null,
        category_prices:
          type === "tournaments" ? item.category_prices || {} : {},
        prizes: item.prizes || null,
        image_path: imagePath,
        brochure_path: brochurePath,
        status: item.status,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("opportunities")
        .insert(record)
        .select()
        .single();

      if (insertError) throw insertError;

      const savedItem = mapOpportunity(inserted);

      setData((previous) => ({
        ...previous,
        [type]: [savedItem, ...previous[type]],
      }));

      return savedItem;
    } catch (error) {
      // Remove uploaded files if the database insert fails.

      const uploadedFiles = [imagePath, brochurePath].filter(Boolean);

      if (uploadedFiles.length) {
        const { error: cleanupError } =
          await storage.remove(uploadedFiles);

        if (cleanupError) {
          console.error("Storage cleanup failed:", cleanupError);
        }
      }

      throw error;
    }
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

    if (error) throw error;

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

    if (error) throw error;

    const filesToRemove = [
      item.image_path,
      item.brochure_path,
    ].filter(Boolean);

    if (filesToRemove.length) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filesToRemove);

      if (storageError) {
        console.error("Storage file deletion failed:", storageError);
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
  const [brochureFile, setBrochureFile] = useState(null);
  const [categoryText, setCategoryText] = useState("");
  const [categoryPrices, setCategoryPrices] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const categoryNames = [
    ...new Set(
      categoryText
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean)
    ),
  ];

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Please select an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setErrorMessage("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleBrochure = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setBrochureFile(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setErrorMessage("Please upload a PDF brochure.");
      event.target.value = "";
      setBrochureFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Brochure size must be below 10 MB.");
      event.target.value = "";
      setBrochureFile(null);
      return;
    }

    setErrorMessage("");
    setBrochureFile(file);
  };

  const updateCategoryPrice = (category, value) => {
    setCategoryPrices((previous) => ({
      ...previous,
      [category]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const form = new FormData(event.currentTarget);

    const getValue = (name) =>
      (form.get(name) || "").toString().trim();

    const title = getValue("title");
    const description = getValue("description");

    if (!title || !description) {
      setErrorMessage("Please enter the title and description.");
      return;
    }

    let prices = {};

    if (type === "tournaments") {
      if (categoryNames.length === 0) {
        setErrorMessage("Please enter at least one tournament category.");
        return;
      }

      const missingPrice = categoryNames.find((category) => {
        const value = categoryPrices[category];

        return (
          value === undefined ||
          String(value).trim() === "" ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
        );
      });

      if (missingPrice) {
        setErrorMessage(
          `Please enter a valid entry fee for ${missingPrice}.`
        );
        return;
      }

      prices = Object.fromEntries(
        categoryNames.map((category) => [
          category,
          Number(categoryPrices[category]),
        ])
      );
    }

    const item = {
      title,
      description,
      date: getValue("date"),
      time: getValue("time"),
      venue: getValue("venue"),
      fee: getValue("fee"),
      deadline: getValue("deadline"),
      instructor: getValue("instructor"),
      duration: getValue("duration"),
      platform: getValue("platform"),
      format: getValue("format"),
      category:
        type === "tournaments"
          ? categoryNames.join(", ")
          : getValue("category"),
      category_prices: prices,
      prizes: getValue("prizes"),
      imageFile,
      brochureFile,
      status: form.get("publish") ? "Published" : "Draft",
    };

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
    <div
      className="uc-op-modal-overlay"
      onMouseDown={onClose}
    >
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
              <img src={imagePreview} alt="Poster preview" />
            ) : (
              <>
                <ImagePlus size={30} />
                <strong>Upload {config.singular} Image</strong>
                <span>
                  Select an image from your device (max 5 MB)
                </span>
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

          {/* VENUE */}

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
                Categories *
                <input
                  value={categoryText}
                  onChange={(event) => {
                    setCategoryText(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Under 8, Under 10, Under 12, Open"
                  required
                />
                <small>
                  Separate each category using a comma.
                </small>
              </label>

              {categoryNames.length > 0 && (
                <div className="uc-op-category-prices">
                  <h3>Category-wise Entry Fees *</h3>
                  <p>
                    Enter the registration price for every category.
                  </p>

                  {categoryNames.map((category) => (
                    <div
                      className="uc-op-category-price-row"
                      key={category}
                    >
                      <strong>{category}</strong>

                      <label>
                        <span>Entry Fee (₹)</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Enter amount"
                          value={categoryPrices[category] ?? ""}
                          onChange={(event) =>
                            updateCategoryPrice(
                              category,
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <label>
                Prizes
                <input
                  name="prizes"
                  placeholder="Enter prize details"
                />
              </label>

              {/* BROCHURE UPLOAD */}

              <div className="uc-op-brochure-upload">
                <div className="uc-op-brochure-heading">
                  <FileText size={23} />
                  <div>
                    <strong>Tournament Brochure (PDF)</strong>
                    <p>
                      Upload a PDF for visitors to view and download.
                      Maximum size: 10 MB.
                    </p>
                  </div>
                </div>

                <label className="uc-op-brochure-input">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleBrochure}
                  />

                  <span>
                    {brochureFile
                      ? brochureFile.name
                      : "Choose PDF Brochure"}
                  </span>
                </label>

                {brochureFile && (
                  <button
                    type="button"
                    className="uc-op-brochure-remove"
                    onClick={() => setBrochureFile(null)}
                  >
                    Remove selected brochure
                  </button>
                )}
              </div>
            </>
          )}

          {/* FEE AND DEADLINE */}

          <div className="uc-op-form-two">
            {type !== "tournaments" && (
              <label>
                Fee
                <input
                  name="fee"
                  placeholder="₹500"
                />
              </label>
            )}

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
          item.status === "Published" ? "Draft" : "Published",
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

                {/* <div className={`uc-op-card-banner ${config.accent}`}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <PageIcon size={42} />
                  )}
                </div> */}

                <div className={`uc-op-card-banner ${config.accent}`}>
  {item.image ? (
    <img
      src={item.image}
      alt={item.title}
      className="uc-op-card-poster"
    />
  ) : (
    <PageIcon size={42} />
  )}
</div>

{/* BROCHURE BUTTONS DIRECTLY UNDER IMAGE */}

{type === "tournaments" && item.brochure && (
  <div className="uc-op-brochure-actions">
    <a
      href={item.brochure}
      target="_blank"
      rel="noopener noreferrer"
      className="uc-op-brochure-view"
    >
      <Eye size={17} />
      View Brochure
    </a>

    <a
      href={item.brochureDownload}
      className="uc-op-brochure-download"
    >
      <Download size={17} />
      Download PDF
    </a>
  </div>
)}

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

                  {/* CATEGORY-WISE FEES */}

                  {type === "tournaments" &&
                    Object.keys(item.category_prices || {}).length > 0 && (
                      <div className="uc-op-category-fee-list">
                        <strong>Entry Fees</strong>

                        {Object.entries(item.category_prices).map(
                          ([category, price]) => (
                            <span key={category}>
                              {category}: ₹
                              {Number(price).toLocaleString("en-IN")}
                            </span>
                          )
                        )}
                      </div>
                    )}

                  {item.deadline && (
                    <p className="uc-op-deadline">
                      Registration deadline: {formatDate(item.deadline)}
                    </p>
                  )}

                  {/* BROCHURE LINKS */}

                  {/* {type === "tournaments" && item.brochure && (
                    <div className="uc-op-brochure-actions">
                      <a
                        href={item.brochure}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="uc-op-brochure-view"
                      >
                        <Eye size={17} />
                        View Brochure
                      </a>

                      <a
                        href={item.brochureDownload}
                        className="uc-op-brochure-download"
                      >
                        <Download size={17} />
                        Download PDF
                      </a>
                    </div>
                  )} */}

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

        <p className="uc-op-form-intro">{item.title}</p>

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
            <input type="date" name="dob" required />
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
            Submit{" "}
            {type === "online-classes" ? "Enrollment" : "Registration"}
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
