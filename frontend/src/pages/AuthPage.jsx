import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastProvider";

const defaultRegisterState = {
  name: "",
  email: "",
  password: "",
  squad: "Squad 1",
  batch: "Batch 1",
  role: "Employee",
  adminInviteToken: "",
};

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(defaultRegisterState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || "/";

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(loginForm);
      showToast("Login successful.");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await register(registerForm);
      showToast("Registration successful.");
      navigate("/", { replace: true });
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <p className="eyebrow">Hybrid workplace orchestration</p>
        <h1>Plan seats, protect rules, and keep squads moving.</h1>
        <p className="hero-copy">
          Manage fixed and floating seats, enforce batch schedules, track holidays, and update live availability from a
          single workspace.
        </p>

        <div className="hero-highlights">
          <div className="hero-card">
            <strong>50 Seats</strong>
            <span>40 fixed + 10 floating seats modeled with role-aware access.</span>
          </div>
          <div className="hero-card">
            <strong>Live Availability</strong>
            <span>Socket-powered updates keep every user in sync during concurrent booking.</span>
          </div>
          <div className="hero-card">
            <strong>Admin Control</strong>
            <span>Manage holidays, assignments, analytics, users, and occupancy trends.</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="alex@company.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter your password"
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label>
              Full Name
              <input
                type="text"
                value={registerForm.name}
                onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Alex Johnson"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="alex@company.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Create a password"
                required
                minLength={6}
              />
            </label>

            <div className="two-column-grid">
              <label>
                Squad
                <select
                  value={registerForm.squad}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, squad: event.target.value }))}
                >
                  {Array.from({ length: 10 }, (_, index) => `Squad ${index + 1}`).map((squad) => (
                    <option key={squad} value={squad}>
                      {squad}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Batch
                <select
                  value={registerForm.batch}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, batch: event.target.value }))}
                >
                  <option value="Batch 1">Batch 1</option>
                  <option value="Batch 2">Batch 2</option>
                </select>
              </label>
            </div>

            <div className="two-column-grid">
              <label>
                Role
                <select
                  value={registerForm.role}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>

              <label>
                Admin Invite Token
                <input
                  type="password"
                  value={registerForm.adminInviteToken}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, adminInviteToken: event.target.value }))
                  }
                  placeholder="Required for admin"
                />
              </label>
            </div>

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default AuthPage;
