
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

function TournamentRegistration() {
  const { itemId } = useParams();
  const { state } = useLocation();

  const tournament = state?.tournament;

  const [form, setForm] = useState({
    studentName: "",
    dob: "",
    gender: "",
    category: "",
    fideId: "",
    rating: "",
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

  const updateField = (event) => {
    const { name, value } = event.target;
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

  const categories = tournament?.category
    ? tournament.category
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : ["Under 8", "Under 10", "Under 12", "Under 15", "Open"];

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tournament) {
      setMessage("Tournament details are missing. Please return to the tournament list.");
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
      // 1. Generate a unique storage file path
      const safeFileName = paymentFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      uploadedFilePath = `${itemId}/${Date.now()}-${safeFileName}`;

      // 2. Upload payment screenshot to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(uploadedFilePath, paymentFile, {
          contentType: paymentFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 3. Save registration details in Supabase Database
      const registrationData = {
        tournament_id: itemId,
        tournament_name: tournament.title,
        tournament_date: tournament.date || null,
        tournament_venue: tournament.venue || null,
        tournament_fee: tournament.fee || null,

        student_name: form.studentName.trim(),
        date_of_birth: form.dob,
        gender: form.gender,
        category: form.category,

        fide_id: form.fideId.trim() || null,
        chess_rating: form.rating
          ? Number(form.rating)
          : null,

        academy: form.academy.trim() || null,
        parent_name: form.parentName.trim(),
        mobile_number: form.mobile.trim(),
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,

        payment_screenshot: uploadedFilePath,
        payment_file_name: paymentFile.name,
        payment_status: "Pending Verification",
      };

      const { error: insertError } = await supabase
        .from("tournament_registrations")
        .insert([registrationData]);

      if (insertError) {
        throw insertError;
      }

      // 4. Show success only after both operations succeed
      setSuccess(true);

    } catch (error) {
      console.error("Tournament registration error:", error);

      // Remove uploaded file if database insertion failed
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
          <p>
            Complete the form below to register for the tournament.
          </p>
        </section>

        <section className="tr-event-card">
          <div>
            <span className="tr-event-label">TOURNAMENT</span>

            <h2>{tournament.title}</h2>

            {tournament.date && (
              <p>
                <CalendarDays size={16} />
                {new Date(
                  `${tournament.date}T00:00:00`
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            {tournament.venue && (
              <p>
                <MapPin size={16} />
                {tournament.venue}
              </p>
            )}
          </div>

          {tournament.fee && (
            <div className="tr-event-fee">
              <span>Entry Fee</span>
              <strong>{tournament.fee}</strong>
            </div>
          )}
        </section>

        <form className="tr-form" onSubmit={handleSubmit}>

          {/* STUDENT DETAILS */}
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
                FIDE ID <span className="tr-optional">Optional</span>
                <input
                  name="fideId"
                  value={form.fideId}
                  onChange={updateField}
                  placeholder="Enter FIDE ID if available"
                />
              </label>

              <label>
                Chess Rating <span className="tr-optional">Optional</span>
                <input
                  type="number"
                  name="rating"
                  min="0"
                  step="1"
                  value={form.rating}
                  onChange={updateField}
                  placeholder="Enter rating if available"
                />
              </label>
            </div>
          </section>

          {/* CATEGORY */}
          <section className="tr-form-section">
            <h2>02. Tournament Category</h2>

            <label>
              Select Category *
              <select
                name="category"
                value={form.category}
                onChange={updateField}
                required
              >
                <option value="">Choose category</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {/* PARENT DETAILS */}
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
                  value={form.mobile}
                  onChange={updateField}
                  placeholder="10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  maxLength="10"
                  required
                />
              </label>

              <label className="tr-full">
                Email Address <span className="tr-optional">Optional</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="Enter email address"
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

          {/* PAYMENT */}
          <section className="tr-form-section">
            <h2>04. Payment Details</h2>

            <p className="tr-payment-text">
              Scan the QR code below to complete your tournament
              registration payment.
            </p>

            <div className="tr-payment-qr">
              <h3>Scan & Pay</h3>

              <img
                src={paymentQR}
                alt="Unpuzzle Club tournament payment QR code"
              />

              <p>
                Scan using any UPI payment application.
              </p>
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

                <small>JPG, PNG or WEBP • Maximum 5 MB</small>
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
