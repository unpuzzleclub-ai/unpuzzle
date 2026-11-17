
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

import {
  ArrowLeft,
  Search,
  Download,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  RefreshCw,
  Filter,
  Printer,
  UserCheck,
  FileSpreadsheet,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  Trophy,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "../styles/AdminRegistrations.css";

const STATUS_OPTIONS = [
  "All",
  "Pending Verification",
  "Verified",
  "Rejected",
];

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClass = (status) => {
  if (status === "Verified") return "verified";
  if (status === "Rejected") return "rejected";
  return "pending";
};

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tournamentFilter, setTournamentFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [checkInFilter, setCheckInFilter] = useState("All");

  const [selectedRegistration, setSelectedRegistration] =
    useState(null);

  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotError, setScreenshotError] = useState("");

  const loadRegistrations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("tournament_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setRegistrations(data || []);
    } catch (err) {
      console.error("Registration loading error:", err);
      setError(err.message || "Unable to load registrations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const tournaments = useMemo(() => {
    return [
      ...new Set(
        registrations
          .map((item) => item.tournament_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [registrations]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        registrations
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [registrations]);

  const stats = useMemo(() => {
    return {
      total: registrations.length,
      pending: registrations.filter(
        (item) => item.payment_status === "Pending Verification"
      ).length,
      verified: registrations.filter(
        (item) => item.payment_status === "Verified"
      ).length,
      rejected: registrations.filter(
        (item) => item.payment_status === "Rejected"
      ).length,
      checkedIn: registrations.filter(
        (item) => item.checked_in === true
      ).length,
    };
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return registrations.filter((item) => {
      const searchable = [
        item.student_name,
        item.parent_name,
        item.mobile_number,
        item.email,
        item.tournament_name,
        item.category,
        item.academy,
        item.fide_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchable.includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        item.payment_status === statusFilter;

      const matchesTournament =
        tournamentFilter === "All" ||
        item.tournament_name === tournamentFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      const matchesCheckIn =
        checkInFilter === "All" ||
        (checkInFilter === "Checked In" && item.checked_in === true) ||
        (checkInFilter === "Not Checked In" && item.checked_in !== true);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTournament &&
        matchesCategory &&
        matchesCheckIn
      );
    });
  }, [
    registrations,
    search,
    statusFilter,
    tournamentFilter,
    categoryFilter,
    checkInFilter,
  ]);

  const updatePaymentStatus = async (registration, newStatus) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark this payment as ${newStatus}?`
    );

    if (!confirmed) return;

    setActionLoading(registration.id);

    try {
      const { data, error: updateError } = await supabase
        .from("tournament_registrations")
        .update({ payment_status: newStatus })
        .eq("id", registration.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setRegistrations((previous) =>
        previous.map((item) =>
          item.id === registration.id ? data : item
        )
      );

      setSelectedRegistration(data);
    } catch (err) {
      console.error("Payment status update error:", err);
      alert(err.message || "Unable to update payment status.");
    } finally {
      setActionLoading("");
    }
  };

  const updateCheckIn = async (registration) => {
    const newValue = !registration.checked_in;

    setActionLoading(registration.id);

    try {
      const { data, error: updateError } = await supabase
        .from("tournament_registrations")
        .update({ checked_in: newValue })
        .eq("id", registration.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setRegistrations((previous) =>
        previous.map((item) =>
          item.id === registration.id ? data : item
        )
      );

      if (selectedRegistration?.id === registration.id) {
        setSelectedRegistration(data);
      }
    } catch (err) {
      console.error("Check-in update error:", err);
      alert(err.message || "Unable to update check-in status.");
    } finally {
      setActionLoading("");
    }
  };

  const openRegistration = async (registration) => {
    setSelectedRegistration(registration);
    setScreenshotUrl("");
    setScreenshotError("");

    if (!registration.payment_screenshot) return;

    setScreenshotLoading(true);

    try {
      const { data, error: signedUrlError } = await supabase.storage
        .from("payment-screenshots")
        .createSignedUrl(registration.payment_screenshot, 300);

      if (signedUrlError) throw signedUrlError;

      setScreenshotUrl(data?.signedUrl || "");
    } catch (err) {
      console.error("Screenshot loading error:", err);
      setScreenshotError(
        err.message || "Unable to load payment screenshot."
      );
    } finally {
      setScreenshotLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!filteredRegistrations.length) {
      alert("There are no registrations to export.");
      return;
    }

    const rows = filteredRegistrations.map((item, index) => ({
      "S.No": index + 1,
      "Student Name": item.student_name || "",
      "Parent Name": item.parent_name || "",
      "Mobile Number": item.mobile_number || "",
      Email: item.email || "",
      Tournament: item.tournament_name || "",
      "Tournament Date": item.tournament_date || "",
      Venue: item.tournament_venue || "",
      Category: item.category || "",
      Gender: item.gender || "",
      "Date of Birth": item.date_of_birth || "",
      Academy: item.academy || "",
      "FIDE ID": item.fide_id || "",
      Rating: item.chess_rating || "",
      "Registration Fee": item.tournament_fee ?? "",
      "Payment Status": item.payment_status || "",
      "Check-in Status": item.checked_in ? "Checked In" : "Not Checked In",
      "Registered On": formatDateTime(item.created_at),
      Notes: item.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 28 },
      { wch: 30 },
      { wch: 16 },
      { wch: 32 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 22 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 32 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Registrations"
    );

    const safeName = (tournamentFilter === "All"
      ? "All_Tournaments"
      : tournamentFilter.replace(/[^a-z0-9]/gi, "_")
    );

    XLSX.writeFile(
      workbook,
      `Unpuzzle_Registrations_${safeName}.xlsx`
    );
  };

  const printCheckInList = () => {
    const participants = filteredRegistrations.filter(
      (item) => item.payment_status === "Verified"
    );

    if (!participants.length) {
      alert("No verified participants in the current selection.");
      return;
    }

    const rows = participants
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.student_name || ""}</td>
            <td>${item.parent_name || ""}</td>
            <td>${item.mobile_number || ""}</td>
            <td>${item.category || ""}</td>
            <td>${item.checked_in ? "Checked In" : "__________"}</td>
          </tr>
        `
      )
      .join("");

    const tournamentName =
      tournamentFilter === "All"
        ? "All Tournaments"
        : tournamentFilter;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print the check-in list.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Participant Check-in List</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
          h1 { margin-bottom: 5px; font-size: 22px; }
          p { color: #555; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #ccc; padding: 10px; text-align: left; font-size: 12px; }
          th { background: #f2f2f2; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Unpuzzle Club — Participant Check-in</h1>
        <p>${tournamentName}</p>
        <p>Printed on: ${new Date().toLocaleString("en-IN")}</p>
        <p>Total verified participants: ${participants.length}</p>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student</th>
              <th>Parent</th>
              <th>Mobile</th>
              <th>Category</th>
              <th>Check-in</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTournamentFilter("All");
    setCategoryFilter("All");
    setCheckInFilter("All");
  };

  return (
    <div className="ar-page">
      <div className="ar-container">
        <header className="ar-header">
          <div>
            <Link to="/admin" className="ar-back-link">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <p className="ar-eyebrow">ADMINISTRATION</p>
            <h1>Registrations</h1>
            <p className="ar-subtitle">
              Manage tournament participants, payments and check-ins.
            </p>
          </div>

          <div className="ar-header-actions">
            <button
              className="ar-btn ar-btn-secondary"
              onClick={() => loadRegistrations(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "ar-spin" : ""}
              />
              Refresh
            </button>

            <button
              className="ar-btn ar-btn-primary"
              onClick={exportToExcel}
            >
              <FileSpreadsheet size={17} />
              Export Excel
            </button>
          </div>
        </header>

        {error && (
          <div className="ar-error">
            <XCircle size={18} />
            <span>{error}</span>
            <button onClick={() => loadRegistrations(true)}>
              Retry
            </button>
          </div>
        )}

        <section className="ar-stats">
          <div className="ar-stat-card">
            <div className="ar-stat-icon ar-icon-blue">
              <Users size={20} />
            </div>
            <div>
              <span>Total Registrations</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="ar-stat-card">
            <div className="ar-stat-icon ar-icon-amber">
              <Clock size={20} />
            </div>
            <div>
              <span>Pending Payments</span>
              <strong>{stats.pending}</strong>
            </div>
          </div>

          <div className="ar-stat-card">
            <div className="ar-stat-icon ar-icon-green">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span>Verified Payments</span>
              <strong>{stats.verified}</strong>
            </div>
          </div>

          <div className="ar-stat-card">
            <div className="ar-stat-icon ar-icon-red">
              <XCircle size={20} />
            </div>
            <div>
              <span>Rejected Payments</span>
              <strong>{stats.rejected}</strong>
            </div>
          </div>

          <div className="ar-stat-card">
            <div className="ar-stat-icon ar-icon-purple">
              <UserCheck size={20} />
            </div>
            <div>
              <span>Participants Checked In</span>
              <strong>{stats.checkedIn}</strong>
            </div>
          </div>
        </section>

        <section className="ar-toolbar">
          <div className="ar-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search student, parent, mobile or tournament..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="ar-filters">
            <div className="ar-filter-control">
              <Filter size={15} />
              <select
                value={tournamentFilter}
                onChange={(event) =>
                  setTournamentFilter(event.target.value)
                }
              >
                <option value="All">All Tournaments</option>
                {tournaments.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Payment Status" : status}
                </option>
              ))}
            </select>

            <select
              value={checkInFilter}
              onChange={(event) =>
                setCheckInFilter(event.target.value)
              }
            >
              <option value="All">All Check-in Status</option>
              <option value="Checked In">Checked In</option>
              <option value="Not Checked In">Not Checked In</option>
            </select>

            <button
              className="ar-clear-btn"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </section>

        <div className="ar-table-heading">
          <div>
            <h2>Participant Records</h2>
            <p>
              Showing {filteredRegistrations.length} of{" "}
              {registrations.length} registrations
            </p>
          </div>

          <div className="ar-table-actions">
            <button
              className="ar-btn ar-btn-secondary"
              onClick={printCheckInList}
            >
              <Printer size={16} />
              Print Check-in List
            </button>
          </div>
        </div>

        <section className="ar-table-card">
          {loading ? (
            <div className="ar-state">
              <div className="ar-loader" />
              <p>Loading registrations...</p>
            </div>
          ) : error ? (
            <div className="ar-state">
              <XCircle size={30} />
              <h3>Unable to load registrations</h3>
              <p>Check the error message above and try again.</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="ar-state">
              <Users size={34} />
              <h3>No registrations found</h3>
              <p>Try changing your search or filters.</p>
              <button
                className="ar-btn ar-btn-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="ar-table-scroll">
              <table className="ar-table">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Tournament</th>
                    <th>Category</th>
                    <th>Mobile</th>
                    <th>Payment</th>
                    <th>Check-in</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRegistrations.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="ar-participant">
                          <strong>{item.student_name || "—"}</strong>
                          <span>{item.parent_name || "Parent not provided"}</span>
                        </div>
                      </td>

                      <td>
                        <div className="ar-tournament-cell">
                          <strong>{item.tournament_name || "—"}</strong>
                          <span>{formatDate(item.tournament_date)}</span>
                        </div>
                      </td>

                      <td>{item.category || "—"}</td>

                      <td>{item.mobile_number || "—"}</td>

                      <td>
                        <span
                          className={`ar-status ${getStatusClass(
                            item.payment_status
                          )}`}
                        >
                          {item.payment_status || "Pending Verification"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`ar-check-status ${
                            item.checked_in ? "is-checked" : ""
                          }`}
                        >
                          {item.checked_in ? "Checked In" : "Not Checked In"}
                        </span>
                      </td>

                      <td>{formatDate(item.created_at)}</td>

                      <td>
                        <div className="ar-row-actions">
                          <button
                            className="ar-icon-btn"
                            title="View details"
                            onClick={() => openRegistration(item)}
                          >
                            <Eye size={17} />
                          </button>

                          {item.payment_status === "Verified" && (
                            <button
                              className={`ar-icon-btn ${
                                item.checked_in ? "ar-check-active" : ""
                              }`}
                              title={
                                item.checked_in
                                  ? "Undo check-in"
                                  : "Mark checked in"
                              }
                              disabled={actionLoading === item.id}
                              onClick={() => updateCheckIn(item)}
                            >
                              <UserCheck size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedRegistration && (
        <div
          className="ar-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRegistration(null);
              setScreenshotUrl("");
            }
          }}
        >
          <div className="ar-modal">
            <div className="ar-modal-header">
              <div>
                <p className="ar-eyebrow">REGISTRATION DETAILS</p>
                <h2>{selectedRegistration.student_name || "Participant"}</h2>
                <span>
                  Registered {formatDateTime(selectedRegistration.created_at)}
                </span>
              </div>

              <button
                className="ar-modal-close"
                onClick={() => {
                  setSelectedRegistration(null);
                  setScreenshotUrl("");
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ar-modal-body">
              <div className="ar-detail-section">
                <h3>Student Information</h3>
                <div className="ar-detail-grid">
                  <Detail label="Student Name" value={selectedRegistration.student_name} />
                  <Detail label="Date of Birth" value={formatDate(selectedRegistration.date_of_birth)} />
                  <Detail label="Gender" value={selectedRegistration.gender} />
                  <Detail label="Category" value={selectedRegistration.category} />
                  <Detail label="FIDE ID" value={selectedRegistration.fide_id} />
                  <Detail label="Chess Rating" value={selectedRegistration.chess_rating} />
                  <Detail label="Academy" value={selectedRegistration.academy} />
                </div>
              </div>

              <div className="ar-detail-section">
                <h3>Parent / Contact Information</h3>
                <div className="ar-detail-grid">
                  <Detail label="Parent Name" value={selectedRegistration.parent_name} />
                  <Detail label="Mobile Number" value={selectedRegistration.mobile_number} />
                  <Detail label="Email" value={selectedRegistration.email} />
                </div>
              </div>

              <div className="ar-detail-section">
                <h3>Tournament Information</h3>
                <div className="ar-detail-grid">
                  <Detail label="Tournament" value={selectedRegistration.tournament_name} />
                  <Detail label="Date" value={formatDate(selectedRegistration.tournament_date)} />
                  <Detail label="Venue" value={selectedRegistration.tournament_venue} />
                  <Detail label="Registration Fee" value={
                    selectedRegistration.tournament_fee != null
                      ? `₹${selectedRegistration.tournament_fee}`
                      : "—"
                  } />
                </div>
              </div>

              <div className="ar-detail-section">
                <h3>Payment Information</h3>

                <div className="ar-payment-summary">
                  <div>
                    <span>Payment Status</span>
                    <strong
                      className={`ar-status ${getStatusClass(
                        selectedRegistration.payment_status
                      )}`}
                    >
                      {selectedRegistration.payment_status || "Pending Verification"}
                    </strong>
                  </div>

                  <div>
                    <span>Check-in Status</span>
                    <strong>
                      {selectedRegistration.checked_in
                        ? "Checked In"
                        : "Not Checked In"}
                    </strong>
                  </div>
                </div>

                {selectedRegistration.payment_screenshot && (
                  <div className="ar-screenshot">
                    <h4>Payment Screenshot</h4>

                    {screenshotLoading ? (
                      <p>Loading screenshot...</p>
                    ) : screenshotError ? (
                      <p className="ar-inline-error">{screenshotError}</p>
                    ) : screenshotUrl ? (
                      <a
                        href={screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={screenshotUrl}
                          alt="Payment screenshot"
                        />
                        <span>Open full image</span>
                      </a>
                    ) : (
                      <p>Screenshot unavailable.</p>
                    )}
                  </div>
                )}

                {selectedRegistration.payment_file_name && (
                  <p className="ar-file-name">
                    Uploaded file: {selectedRegistration.payment_file_name}
                  </p>
                )}
              </div>

              {selectedRegistration.notes && (
                <div className="ar-detail-section">
                  <h3>Additional Notes</h3>
                  <p className="ar-notes">
                    {selectedRegistration.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="ar-modal-footer">
              <div className="ar-modal-footer-left">
                {selectedRegistration.payment_status !== "Verified" && (
                  <button
                    className="ar-btn ar-btn-success"
                    disabled={actionLoading === selectedRegistration.id}
                    onClick={() =>
                      updatePaymentStatus(selectedRegistration, "Verified")
                    }
                  >
                    <CheckCircle2 size={16} />
                    Verify Payment
                  </button>
                )}

                {selectedRegistration.payment_status !== "Rejected" && (
                  <button
                    className="ar-btn ar-btn-danger"
                    disabled={actionLoading === selectedRegistration.id}
                    onClick={() =>
                      updatePaymentStatus(selectedRegistration, "Rejected")
                    }
                  >
                    <XCircle size={16} />
                    Reject Payment
                  </button>
                )}
              </div>

              {selectedRegistration.payment_status === "Verified" && (
                <button
                  className={`ar-btn ${
                    selectedRegistration.checked_in
                      ? "ar-btn-secondary"
                      : "ar-btn-primary"
                  }`}
                  disabled={actionLoading === selectedRegistration.id}
                  onClick={() => updateCheckIn(selectedRegistration)}
                >
                  <UserCheck size={16} />
                  {selectedRegistration.checked_in
                    ? "Undo Check-in"
                    : "Mark Check-in"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="ar-detail-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
