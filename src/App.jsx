
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ChessAcademies from "./pages/ChessAcademies";
import VishalChessAcademy from "./pages/VishalChessAcademy";
import AdminRegistrations from "./pages/AdminRegistrations";

import {
  OpportunityProvider,
  OpportunityListingPage,
  OpportunityRegistrationPage,
} from "./pages/Opportunities";

import TournamentRegistration from "./pages/TournamentRegistration";

import AdminDashboard, {
  ProtectedAdminRoute,
} from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <OpportunityProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* PUBLIC OPPORTUNITY PAGES */}

          <Route
            path="/events"
            element={<OpportunityListingPage type="events" />}
          />

          <Route
            path="/tournaments"
            element={<OpportunityListingPage type="tournaments" />}
          />

          <Route
            path="/online-classes"
            element={<OpportunityListingPage type="online-classes" />}
          />

          {/* REGISTRATION PAGES */}

          <Route
            path="/tournaments/:itemId/register"
            element={<TournamentRegistration />}
          />

          <Route
            path="/:type/:itemId/register"
            element={<OpportunityRegistrationPage />}
          />

          {/* CHESS PAGES */}

          <Route
            path="/activities/chess"
            element={<ChessAcademies />}
          />

          <Route
            path="/vishal-chess-academy"
            element={<VishalChessAcademy />}
          />

          {/* PROTECTED ADMIN DASHBOARD */}

          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
  path="/admin/registrations"
  element={
    <ProtectedAdminRoute>
      <AdminRegistrations />
    </ProtectedAdminRoute>
  }
/>

        </Routes>
      </OpportunityProvider>
    </BrowserRouter>
  );
}

export default App;
