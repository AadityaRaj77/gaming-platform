import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import TeamPage from "./pages/TeamPage";
import PlayerProfile from "./pages/PlayerProfile";

const isAuth = () => !!localStorage.getItem("token");

const PrivateRoute = ({ children }) => {
  return isAuth() ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
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
      <Route path="/:username" element={<PlayerProfile />} />
    </Routes>
    
  );
}
