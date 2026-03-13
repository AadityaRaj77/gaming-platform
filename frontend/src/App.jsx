import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import TeamPage from "./pages/TeamPage";
import PlayerProfile from "./pages/PlayerProfile";
import NotificationsSocket from "./NotificationsSocket";
import TournamentCreate from "./pages/TournamentCreate";
import TournamentDashboard from "./pages/TournamentDashboard";
import TournamentList from "./pages/TournamentList";
import TournamentRegister from "./pages/TournamentRegister";
import TournamentFormBuilder from "./pages/TournamentFormBuilder";

const isAuth = () => !!localStorage.getItem("token");

const PrivateRoute = ({ children }) => {
  return isAuth() ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <>
      {/* ✅ Global socket must be OUTSIDE <Routes> */}
      <NotificationsSocket />

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route
          path="/teams/:teamId"
          element={
            <PrivateRoute>
              <TeamPage />
            </PrivateRoute>
          }
        />

        {/* public player profile */}
        <Route path="/:username" element={<PlayerProfile />} />

        <Route
  path="/tournaments/create"
  element={
    <PrivateRoute>
      <TournamentCreate />
    </PrivateRoute>
  }
/>
<Route path="/tournaments/create" element={<TournamentCreate />} />
<Route path="/tournaments/:id" element={<TournamentDashboard />} />
<Route path="/tournaments/:id/form-builder" element={<TournamentFormBuilder />} />
<Route path="/tournaments/:id/register/:slug" element={<TournamentRegister />} />
<Route path="/tournaments" element={<TournamentList />} />
</Routes>
    </>
  );
}
