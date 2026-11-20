
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  CheckCircle2,
  Upload,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import paymentQR from "../assets/payments-qr.png";
import "../styles/TournamentRegistration.css";

const DEFAULT_CATEGORIES = [
  "Under 8",
  "Under 10",
  "Under 12",
  "Under 15",
  "Open",
];

function calculateAge(dob, eventDate) {
  if (!dob || !eventDate) return null;

  const birth = new Date(`${dob}T00:00:00`);
  const event = new Date(`${eventDate}T00:00:00`);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(event.getTime())) {
    return null;
  }

  if (birth > event) return null;

  let age = event.getFullYear() - birth.getFullYear();

  const birthdayNotReached =
    event.getMonth() < birth.getMonth() ||
    (event.getMonth() === birth.getMonth() &&
      event.getDate() < birth.getDate());

  if (birthdayNotReached) age--;

  return age;
}

function getCategoryLimit(category) {
  const match = category.match(/(?:under|u)[\s-]*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function getEligibleCategories(categories, age) {
  if (age === null) return [];

  return categories.filter((category) => {
    if (category.toLowerCase() === "open") return true;

    const limit = getCategoryLimit(category);
    return limit !== null && age < limit;
  });
}

function getDefaultCategory(categories, age) {
  const eligible = getEligibleCategories(categories, age);

  const ageCategories = eligible
    .filter((category) => category.toLowerCase() !== "open")
    .sort((a, b) => getCategoryLimit(a) - getCategoryLimit(b));

  return ageCategories[0] || eligible.find(
    (category) => category.toLowerCase() === "open"
  ) || "";
}

function getCategoryPrices(tournament) {
  let prices = tournament?.category_prices || {};

  if (typeof prices === "string") {
    try {
      prices = JSON.parse(prices);
    } catch {
      prices = {};
    }
  }

  return prices && typeof prices === "object" ? prices : {};
}

function TournamentRegistration() {
  const { itemId } = useParams();
  const { state } = useLocation();

  const tournament = state?.tournament;

  const categories = Array.isArray(tournament?.category)
    ? tournament.category
    : tournament?.category
      ? tournament.category.split(",").map((item) => item.trim()).filter(Boolean)
      : DEFAULT_CATEGORIES;

  const eventDate = tournament?.date || "";
  const categoryPrices = getCategoryPrices(tournament);

  const [form, setForm] = useState({
    studentName: "",
    dob: "",
    gender: "",
    category: "",
    kscaId: "",
    academy: "",
    parentName: "",
    mobile: "",
    email: "",
    notes: "",
  });

  const [paymentFile, setPaymentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const age = calculateAge(form.dob, eventDate);
  const eligibleCategories = getEligibleCategories(categories, age);

  const selectedFee =
    form.category && categoryPrices[form.category] !== undefined
      ? Number(categoryPrices[form.category])
      : null;

  const updateField = (event) => {
    const { name, value } = event.target;

    if (name === "mobile") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

      setForm((previous) => ({
        ...previous,
        mobile: digitsOnly,
      }));
      return;
    }

    if (name === "dob") {
      const calculatedAge = calculateAge(value, eventDate);
      const defaultCategory = getDefaultCategory(categories, calculatedAge);

      setForm((previous) => ({
        ...previous,
        dob: value,
        category: defaultCategory,
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPaymentFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload a JPG, PNG, or WEBP image.");
      setPaymentFile(null);
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Image size must be below 2 MB.");
      setPaymentFile(null);
      event.target.value = "";
      return;
    }

    setMessage("");
    setPaymentFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tournament) {
      setMessage("Tournament details are missing. Please return to the tournament list.");
      return;
    }

    if (!form.dob || age === null) {
      setMessage("Please enter a valid date of birth.");
      return;
    }

    if (!eligibleCategories.includes(form.category)) {
      setMessage("Please select an eligible tournament category.");
      return;
    }

    if (!Number.isFinite(selectedFee) || selectedFee < 0) {
      setMessage("The entry fee for this category is not configured. Please contact the organiser.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setMessage("Please enter a valid email address containing @ and a valid domain.");
      return;
    }

    if (!paymentFile) {
      setMessage("Please upload your payment screenshot.");
      return;
    }

    setLoading(true);
    setMessage("");

    let uploadedFilePath = null;

    try {
      const safeFileName = paymentFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      uploadedFilePath = `${itemId}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(uploadedFilePath, paymentFile, {
          contentType: paymentFile.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const registrationData = {
        tournament_id: itemId,
        tournament_name: tournament.title,
        tournament_date: tournament.date || null,
        tournament_venue: tournament.venue || null,
        tournament_fee: selectedFee,

        student_name: form.studentName.trim(),
        date_of_birth: form.dob,
        gender: form.gender,
        category: form.category,

        ksca_id: form.kscaId.trim() || null,

        academy: form.academy.trim() || null,
        parent_name: form.parentName.trim(),
        mobile_number: form.mobile,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,

        payment_screenshot: uploadedFilePath,
        payment_file_name: paymentFile.name,
        payment_status: "Pending Verification",
      };

      const { error: insertError } = await supabase
        .from("tournament_registrations")
        .insert([registrationData]);

      if (insertError) throw insertError;

      setSuccess(true);
    } catch (error) {
      console.error("Tournament registration error:", error);

      if (uploadedFilePath) {
        await supabase.storage
          .from("payment-screenshots")
          .remove([uploadedFilePath]);
      }

      setMessage(
        error.message ||
        "Unable to submit registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!tournament) {
    return (
      <main className="tr-page">
        <div className="tr-container tr-not-found">
          <h2>Tournament details not found</h2>
          <p>
            Please return to the tournaments page and click
            Register on your selected tournament.
          </p>
          <Link to="/tournaments" className="tr-primary-button">
            <ArrowLeft size={17} />
            Back to Tournaments
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="tr-page">
        <div className="tr-success-card">
          <CheckCircle2 size={60} />
          <h1>Registration Submitted!</h1>
          <p>
            Your registration for {tournament.title} has been
            successfully submitted.
          </p>
          <p><strong>Category:</strong> {form.category}</p>
          <p><strong>Entry Fee:</strong> ₹{selectedFee}</p>
          <p className="tr-pending">
            Payment Status: Pending Verification
          </p>
          <Link to="/tournaments" className="tr-primary-button">
            Back to Tournaments
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="tr-page">
      <div className="tr-container">
        <header className="tr-topbar">
          <Link to="/tournaments" className="tr-back-link">
            <ArrowLeft size={17} />
            Back to Tournaments
          </Link>
          <Link to="/" className="tr-brand">
            Unpuzzle Club
          </Link>
        </header>

        <section className="tr-heading">
          <span>UNPUZZLE CLUB • CHESS</span>
          <h1>Tournament Registration</h1>
          <p>Complete the form below to register for the tournament.</p>
        </section>

        <section className="tr-event-card">
          <div>
            <span className="tr-event-label">TOURNAMENT</span>
            <h2>{tournament.title}</h2>

            {tournament.date && (
              <p>
                <CalendarDays size={16} />
                {new Date(`${tournament.date}T00:00:00`).toLocaleDateString(
                  "en-IN",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </p>
            )}

            {tournament.venue && (
              <p>
                <MapPin size={16} />
                {tournament.venue}
              </p>
            )}
          </div>
        </section>

        <form className="tr-form" onSubmit={handleSubmit}>
          <section className="tr-form-section">
            <h2>01. Student Details</h2>

            <div className="tr-grid">
              <label>
                Student Name *
                <input
                  name="studentName"
                  value={form.studentName}
                  onChange={updateField}
                  placeholder="Enter student's full name"
                  required
                />
              </label>

              <label>
                Date of Birth *
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={updateField}
                  max={eventDate || undefined}
                  required
                />
              </label>

              <label>
                Gender *
                <select
                  name="gender"
                  value={form.gender}
                  onChange={updateField}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Academy / School
                <input
                  name="academy"
                  value={form.academy}
                  onChange={updateField}
                  placeholder="Enter academy or school"
                />
              </label>

              <label>
                KSCA ID
                <input
                  name="kscaId"
                  value={form.kscaId}
                  onChange={updateField}
                  placeholder="Enter KSCA ID"
                />
              </label>
            </div>
          </section>

          <section className="tr-form-section">
            <h2>02. Tournament Category</h2>

            {form.dob && (
              <div className="tr-age-info">
                <p>
                  <strong>Age on tournament date:</strong>{" "}
                  {age === null ? "Invalid date" : `${age} years`}
                </p>
                <small>
                  Your age category is selected automatically. You may
                  choose a higher eligible category.
                </small>
              </div>
            )}

            <label>
              Select Category *
              <select
                name="category"
                value={form.category}
                onChange={updateField}
                required
                disabled={!form.dob || eligibleCategories.length === 0}
              >
                <option value="">Choose category</option>
                {eligibleCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            {form.category && (
              <div className="tr-selected-fee">
                <span>Entry Fee — {form.category}</span>
                <strong>
                  {Number.isFinite(selectedFee)
                    ? `₹${selectedFee}`
                    : "Fee not configured"}
                </strong>
              </div>
            )}
          </section>

          <section className="tr-form-section">
            <h2>03. Parent / Guardian Details</h2>

            <div className="tr-grid">
              <label>
                Parent / Guardian Name *
                <input
                  name="parentName"
                  value={form.parentName}
                  onChange={updateField}
                  placeholder="Enter parent or guardian name"
                  required
                />
              </label>

              <label>
                Mobile Number *
                <input
                  type="tel"
                  name="mobile"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={updateField}
                  placeholder="10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  required
                />
              </label>

              <label className="tr-full">
                Email Address
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="example@email.com"
                />
              </label>

              <label className="tr-full">
                Additional Information
                <textarea
                  name="notes"
                  rows="3"
                  value={form.notes}
                  onChange={updateField}
                  placeholder="Any additional information"
                />
              </label>
            </div>
          </section>

          <section className="tr-form-section">
            <h2>04. Payment Details</h2>

            <p className="tr-payment-text">
              Scan the QR code below to complete your tournament
              registration payment.
            </p>

            {form.category && (
              <div className="tr-payment-total">
                <span>Amount to Pay</span>
                <strong>
                  {Number.isFinite(selectedFee) ? `₹${selectedFee}` : "—"}
                </strong>
              </div>
            )}

            <div className="tr-payment-qr">
              <h3>Scan & Pay</h3>
              <img
                src={paymentQR}
                alt="Unpuzzle Club tournament payment QR code"
              />
              <p>Scan using any UPI payment application.</p>
            </div>

            <label className="tr-upload">
              <span>Payment Screenshot *</span>

              <div className="tr-upload-box">
                <Upload size={25} />
                <strong>
                  {paymentFile
                    ? paymentFile.name
                    : "Choose Payment Screenshot"}
                </strong>
                <small>JPG, PNG or WEBP • Maximum 2 MB</small>
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                required
              />
            </label>
          </section>

          {message && (
            <div className="tr-error-message" role="alert">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="tr-submit-button"
            disabled={loading}
          >
            {loading ? "Submitting Registration..." : "Submit Registration"}
          </button>

          <p className="tr-footer-note">
            Your details and payment screenshot will be securely
            submitted for verification.
          </p>
        </form>
      </div>
    </main>
  );
}

export default TournamentRegistration;
