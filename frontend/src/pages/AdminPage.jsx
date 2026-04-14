import { useEffect, useState } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const squadOptions = Array.from({ length: 10 }, (_, index) => `Squad ${index + 1}`);

function AdminPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [seats, setSeats] = useState([]);
  const [userEdits, setUserEdits] = useState({});
  const [seatAssignments, setSeatAssignments] = useState({});
  const [holidayForm, setHolidayForm] = useState({ date: "", name: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAdminData = async () => {
    setIsLoading(true);

    try {
      const [analyticsResponse, usersResponse, holidaysResponse, seatsResponse] = await Promise.all([
        apiRequest("/admin/analytics", { token }),
        apiRequest("/admin/users", { token }),
        apiRequest("/admin/holidays", { token }),
        apiRequest("/seats", { token }),
      ]);

      setAnalytics(analyticsResponse);
      setUsers(usersResponse.users);
      setHolidays(holidaysResponse.holidays);
      setSeats(seatsResponse.seats);
      setUserEdits(
        Object.fromEntries(
          usersResponse.users.map((user) => [user.id, { role: user.role, batch: user.batch, squad: user.squad }])
        )
      );
      setSeatAssignments(
        Object.fromEntries(
          seatsResponse.seats
            .filter((seat) => seat.type === "fixed")
            .map((seat) => [seat.id, seat.assignedUser?.id || ""])
        )
      );
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAddHoliday = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("/admin/holiday", {
        method: "POST",
        token,
        body: holidayForm,
      });
      setHolidayForm({ date: "", name: "" });
      showToast("Holiday added successfully.");
      await loadAdminData();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    setIsSubmitting(true);

    try {
      await apiRequest(`/admin/holiday/${holidayId}`, {
        method: "DELETE",
        token,
      });
      showToast("Holiday removed.");
      await loadAdminData();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSave = async (userId) => {
    setIsSubmitting(true);

    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: "PATCH",
        token,
        body: userEdits[userId],
      });
      showToast("User updated.");
      await loadAdminData();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeatSave = async (seatId) => {
    setIsSubmitting(true);

    try {
      await apiRequest(`/admin/seats/${seatId}/assignment`, {
        method: "PATCH",
        token,
        body: { userId: seatAssignments[seatId] || null },
      });
      showToast("Seat assignment updated.");
      await loadAdminData();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !analytics) {
    return <LoadingOverlay label="Loading admin workspace..." />;
  }

  const fixedSeats = seats.filter((seat) => seat.type === "fixed");

  return (
    <div className="admin-layout">
      {(isLoading || isSubmitting) && <LoadingOverlay label={isSubmitting ? "Saving changes..." : "Refreshing admin data..."} />}

      <section className="admin-top-grid">
        <div className="panel">
          <p className="eyebrow">Occupancy metrics</p>
          <div className="stats-grid">
            <div className="stat-card">
              <strong>{analytics?.totalUsers || 0}</strong>
              <span>Users</span>
            </div>
            <div className="stat-card">
              <strong>{analytics?.totalBookings || 0}</strong>
              <span>Bookings</span>
            </div>
            <div className="stat-card">
              <strong>{analytics?.usageRate || 0}%</strong>
              <span>Usage rate</span>
            </div>
            <div className="stat-card">
              <strong>{analytics?.totalAdmins || 0}</strong>
              <span>Admins</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">Add holiday</p>
          <form className="inline-form" onSubmit={handleAddHoliday}>
            <input
              type="date"
              value={holidayForm.date}
              onChange={(event) => setHolidayForm((current) => ({ ...current, date: event.target.value }))}
              required
            />
            <input
              type="text"
              value={holidayForm.name}
              onChange={(event) => setHolidayForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Holiday name"
              required
            />
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              Save
            </button>
          </form>

          <div className="holiday-list">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="holiday-item">
                <div>
                  <strong>{holiday.name}</strong>
                  <span>{String(holiday.date).slice(0, 10)}</span>
                </div>
                <button type="button" className="danger-button" onClick={() => handleDeleteHoliday(holiday.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Usage analytics</p>
            <h3>Seat demand overview</h3>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>Bookings by date</h4>
            <ul className="info-list compact">
              {analytics?.bookingsByDate?.map((item) => (
                <li key={item.date}>
                  {item.date} - {item.total}
                </li>
              ))}
            </ul>
          </div>

          <div className="analytics-card">
            <h4>Top seats</h4>
            <ul className="info-list compact">
              {analytics?.topSeats?.map((seat) => (
                <li key={seat.seatId}>
                  {seat.label} ({seat.type}) - {seat.total}
                </li>
              ))}
            </ul>
          </div>

          <div className="analytics-card">
            <h4>Squad usage</h4>
            <ul className="info-list compact">
              {analytics?.squadUsage?.map((entry) => (
                <li key={entry._id}>
                  {entry._id} - {entry.total}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Manage users</p>
            <h3>Role, batch, and squad assignment</h3>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Batch</th>
                <th>Squad</th>
                <th>Fixed Seat</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={userEdits[user.id]?.role || user.role}
                      onChange={(event) =>
                        setUserEdits((current) => ({
                          ...current,
                          [user.id]: { ...current[user.id], role: event.target.value },
                        }))
                      }
                    >
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={userEdits[user.id]?.batch || user.batch}
                      onChange={(event) =>
                        setUserEdits((current) => ({
                          ...current,
                          [user.id]: { ...current[user.id], batch: event.target.value },
                        }))
                      }
                    >
                      <option value="Batch 1">Batch 1</option>
                      <option value="Batch 2">Batch 2</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={userEdits[user.id]?.squad || user.squad}
                      onChange={(event) =>
                        setUserEdits((current) => ({
                          ...current,
                          [user.id]: { ...current[user.id], squad: event.target.value },
                        }))
                      }
                    >
                      {squadOptions.map((squad) => (
                        <option key={squad} value={squad}>
                          {squad}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{user.fixedSeat?.seatLabel || "Unassigned"}</td>
                  <td>
                    <button type="button" className="secondary-button" onClick={() => handleUserSave(user.id)}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Manage fixed seats</p>
            <h3>Assign fixed desks to employees</h3>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Seat</th>
                <th>Assigned user</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fixedSeats.map((seat) => (
                <tr key={seat.id}>
                  <td>{seat.label}</td>
                  <td>
                    <select
                      value={seatAssignments[seat.id] || ""}
                      onChange={(event) =>
                        setSeatAssignments((current) => ({ ...current, [seat.id]: event.target.value }))
                      }
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="secondary-button" onClick={() => handleSeatSave(seat.id)}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminPage;
