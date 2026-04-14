import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppShell() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Seat Booking System</p>
          <h1>Workspace Seat Planner</h1>
        </div>

        <nav className="topbar-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          {user?.role === "Admin" && <NavLink to="/admin">Admin Panel</NavLink>}
        </nav>

        <div className="topbar-user">
          <div>
            <strong>{user?.name}</strong>
            <span>
              {user?.role} | {user?.batch}
            </span>
          </div>
          <button className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
