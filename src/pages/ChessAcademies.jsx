import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChessKnight,
  MapPin,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

export default function ChessAcademies() {
  return (
    <div className="chess-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&display=swap');

        .chess-page {
          min-height: 100vh;
          background: #fffdf9;
          color: #29243a;
          font-family: 'Lexend', sans-serif;
          overflow: hidden;
        }

        .chess-container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .chess-header {
          padding: 22px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chess-logo {
          font-size: 23px;
          font-weight: 800;
          color: #44318c;
          text-decoration: none;
          letter-spacing: -1px;
        }

        .chess-logo span {
          color: #f28a65;
        }

        .chess-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #514b63;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 11px 17px;
          border: 1px solid #e9e3f1;
          border-radius: 30px;
          background: white;
          transition: 0.2s ease;
        }

        .chess-back:hover {
          background: #f2edff;
          border-color: #cfc1f6;
          transform: translateY(-2px);
        }

        .chess-hero {
          position: relative;
          margin-top: 22px;
          padding: 65px 35px;
          border-radius: 30px;
          overflow: hidden;
          background: linear-gradient(120deg, #eee8ff, #fce9e6 55%, #fff1d9);
        }

        .chess-hero::before {
          content: '';
          position: absolute;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          right: 8%;
          top: -100px;
        }

        .chess-hero-content {
          position: relative;
          z-index: 1;
          max-width: 680px;
        }

        .chess-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 15px;
          background: rgba(255,255,255,0.75);
          color: #7656c5;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .chess-hero h1 {
          font-size: clamp(34px, 5vw, 54px);
          line-height: 1.15;
          letter-spacing: -2px;
          margin: 0 0 18px;
          color: #302451;
          font-weight: 800;
        }

        .chess-hero h1 span {
          color: #7656c5;
        }

        .chess-hero p {
          max-width: 570px;
          font-size: 15px;
          line-height: 1.8;
          color: #625a70;
          margin: 0;
        }

        .chess-section {
          padding: 65px 0 85px;
        }

        .chess-section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .chess-section-heading h2 {
          font-size: 27px;
          color: #302451;
          margin: 0 0 8px;
          letter-spacing: -0.8px;
        }

        .chess-section-heading p {
          color: #827b8d;
          font-size: 13px;
          margin: 0;
        }

        .chess-count {
          font-size: 12px;
          font-weight: 600;
          color: #7656c5;
          background: #f0ebff;
          padding: 9px 14px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .academy-card {
          display: grid;
          grid-template-columns: 40% 60%;
          background: white;
          border: 1px solid #eee9f4;
          border-radius: 25px;
          overflow: hidden;
          box-shadow: 0 12px 35px rgba(53, 37, 91, 0.06);
          transition: 0.25s ease;
        }

        .academy-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 42px rgba(53, 37, 91, 0.11);
        }

        .academy-visual {
          min-height: 310px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #ded5ff, #b8a8f4);
          overflow: hidden;
        }

        .academy-visual::before,
        .academy-visual::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.22);
        }

        .academy-visual::before {
          width: 230px;
          height: 230px;
          top: -75px;
          left: -70px;
        }

        .academy-visual::after {
          width: 180px;
          height: 180px;
          bottom: -75px;
          right: -45px;
        }

        .academy-chess-icon {
          position: relative;
          z-index: 1;
          width: 125px;
          height: 125px;
          border-radius: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.72);
          color: #5b43a4;
          transform: rotate(-5deg);
          box-shadow: 0 15px 35px rgba(69, 48, 133, 0.13);
        }

        .academy-content {
          padding: 35px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
        }

        .academy-tag {
          display: inline-block;
          color: #7656c5;
          background: #f1edff;
          padding: 7px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 15px;
        }

        .academy-content h3 {
          color: #302451;
          font-size: 25px;
          margin: 0 0 12px;
          letter-spacing: -0.7px;
        }

        .academy-content > p {
          color: #777083;
          font-size: 13px;
          line-height: 1.8;
          margin: 0 0 20px;
          max-width: 480px;
        }

        .academy-details {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-bottom: 25px;
        }

        .academy-detail {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #716a7c;
          font-size: 11px;
          font-weight: 500;
        }

        .academy-detail svg {
          color: #8a6bd2;
        }

        .academy-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 20px;
          border-radius: 30px;
          background: #7656c5;
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .academy-button:hover {
          background: #5e42a7;
          transform: translateY(-2px);
        }

        .chess-coming {
          margin-top: 25px;
          padding: 25px;
          border: 1px dashed #d9d0ec;
          border-radius: 20px;
          text-align: center;
          background: #faf8ff;
        }

        .chess-coming h3 {
          color: #554478;
          font-size: 15px;
          margin: 0 0 7px;
        }

        .chess-coming p {
          color: #898197;
          font-size: 12px;
          margin: 0;
          line-height: 1.7;
        }

        .chess-footer {
          padding: 25px 0;
          border-top: 1px solid #eee9f4;
          text-align: center;
          color: #918a9b;
          font-size: 11px;
        }

        .chess-footer strong {
          color: #7656c5;
        }

        @media (max-width: 700px) {
          .chess-container {
            width: min(100% - 28px, 1180px);
          }

          .chess-header {
            padding: 17px 0;
          }

          .chess-logo {
            font-size: 20px;
          }

          .chess-back {
            padding: 9px 12px;
            font-size: 11px;
          }

          .chess-hero {
            margin-top: 12px;
            padding: 45px 23px;
            border-radius: 23px;
          }

          .chess-hero h1 {
            letter-spacing: -1.2px;
          }

          .chess-hero p {
            font-size: 13px;
          }

          .chess-section {
            padding: 45px 0 60px;
          }

          .chess-section-heading {
            align-items: flex-start;
          }

          .chess-section-heading h2 {
            font-size: 22px;
          }

          .academy-card {
            grid-template-columns: 1fr;
          }

          .academy-visual {
            min-height: 210px;
          }

          .academy-content {
            padding: 25px 22px 28px;
          }

          .academy-content h3 {
            font-size: 22px;
          }

          .academy-details {
            gap: 13px;
          }
        }
      `}</style>

      <div className="chess-container">
        {/* Header */}
        <header className="chess-header">
          <Link to="/" className="chess-logo">
            unpuzzle<span>.</span>club
          </Link>

          <Link to="/" className="chess-back">
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </header>

        {/* Hero */}
        <section className="chess-hero">
          <div className="chess-hero-content">
            <div className="chess-eyebrow">
              <Sparkles size={15} />
              MIND & STRATEGY
            </div>

            <h1>
              Think Smart.
              <br />
              Play <span>Chess.</span>
            </h1>

            <p>
              Discover chess academies that help young minds develop
              strategic thinking, concentration, patience and confidence.
              Find the right place to begin your chess journey.
            </p>
          </div>
        </section>

        {/* Academies */}
        <section className="chess-section">
          <div className="chess-section-heading">
            <div>
              <h2>Explore Chess Academies</h2>
              <p>Find a chess learning centre to start your journey.</p>
            </div>

            <span className="chess-count">1 Academy</span>
          </div>

          {/* Vishal Chess Academy */}
          <article className="academy-card">
            <div className="academy-visual">
              <div className="academy-chess-icon">
                <ChessKnight size={76} strokeWidth={1.5} />
              </div>
            </div>

            <div className="academy-content">
              <span className="academy-tag">Featured Academy</span>

              <h3>Vishal Chess Academy</h3>

              <p>
                Nurturing young minds through chess since 2020.
                Learn, practise and improve your game with structured
                chess coaching programmes.
              </p>

              <div className="academy-details">
                <div className="academy-detail">
                  <MapPin size={15} />
                  Bengaluru
                </div>

                <div className="academy-detail">
                  <Users size={15} />
                  Kids & Beginners
                </div>

                <div className="academy-detail">
                  <Trophy size={15} />
                  Chess Coaching
                </div>
              </div>

              <Link
                to="/vishal-chess-academy"
                className="academy-button"
              >
                Explore Academy
                <ArrowRight size={16} />
              </Link>
            </div>
          </article>

          {/* Future academies */}
          <div className="chess-coming">
            <h3>More Chess Academies Coming Soon!</h3>
            <p>
              We are working on bringing more chess learning opportunities
              to the Unpuzzle Club community.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="chess-footer">
        <div className="chess-container">
          <strong>unpuzzle.club</strong> &nbsp; PLAY • LEARN • GROW
        </div>
      </footer>
    </div>
  );
}
