import { useEffect, useMemo, useState } from "react";
import CalendarStrip from "../components/CalendarStrip";
import LoadingOverlay from "../components/LoadingOverlay";
import SeatDetailsModal from "../components/SeatDetailsModal";
import SeatGrid from "../components/SeatGrid";
import SeatLegend from "../components/SeatLegend";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { getSocket } from "../services/socket";

function DashboardPage() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [availability, setAvailability] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAvailability = async (dateValue = "") => {
    setIsLoading(true);

    try {
      const query = dateValue ? `?date=${dateValue}` : "";
      const response = await apiRequest(`/seats/availability${query}`, { token });
      setAvailability(response);

      if (!selectedDate && response.selectedDate) {
        setSelectedDate(response.selectedDate);
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    loadAvailability(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const socket = getSocket();
    // Live updates keep the seat map fresh when another user books or an admin changes availability.
    const refresh = (payload) => {
      if (!selectedDate || payload.date === selectedDate) {
        loadAvailability(selectedDate);
      }
    };

    socket.on("availability-updated", refresh);
    return () => socket.off("availability-updated", refresh);
  }, [selectedDate]);

  const handleBook = async (seat) => {
    setIsSubmitting(true);

    try {
      await apiRequest("/book", {
        method: "POST",
        token,
        body: {
          seatId: seat.id,
          date: selectedDate,
        },
      });
      setSelectedSeat(null);
      showToast(`Seat ${seat.label} booked for ${selectedDate}.`);
      await loadAvailability(selectedDate);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (seat) => {
    setIsSubmitting(true);

    try {
      await apiRequest("/cancel", {
        method: "POST",
        token,
        body: {
          seatId: seat.id,
          date: selectedDate,
        },
      });
      setSelectedSeat(null);
      showToast(`Booking for ${seat.label} cancelled.`);
      await loadAvailability(selectedDate);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkLeave = async () => {
    setIsSubmitting(true);

    try {
      await apiRequest("/leave", {
        method: "POST",
        token,
        body: { date: selectedDate },
      });
      showToast(`Leave marked for ${selectedDate}.`);
      await loadAvailability(selectedDate);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnmarkLeave = async () => {
    setIsSubmitting(true);

    try {
      await apiRequest("/leave/unmark", {
        method: "POST",
        token,
        body: { date: selectedDate },
      });
      showToast(`Leave removed for ${selectedDate}.`);
      await loadAvailability(selectedDate);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    if (!availability) {
      return { booked: 0, available: 0, floating: 0, fixed: 0 };
    }

    return availability.seats.reduce(
      (summary, seat) => {
        if (seat.isBooked) summary.booked += 1;
        if (!seat.isBooked) summary.available += 1;
        if (seat.type === "floating") summary.floating += 1;
        if (seat.type === "fixed") summary.fixed += 1;
        return summary;
      },
      { booked: 0, available: 0, floating: 0, fixed: 0 }
    );
  }, [availability]);

  if (isLoading && !availability) {
    return <LoadingOverlay label="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-layout">
      {(isLoading || isSubmitting) && <LoadingOverlay label={isSubmitting ? "Updating booking..." : "Refreshing..."} />}

      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Booking window</p>
          <h2>{availability?.bookingWindowDate || "Opens at 3:00 PM for the next working day"}</h2>
          <p className="muted-copy">
            {availability?.canBookToday
              ? `You can book for ${availability.selectedDate} right now.`
              : "Bookings open after 3:00 PM and only for the next working day."}
          </p>
        </div>

        <div className="hero-actions">
          {availability?.hasLeave ? (
            <button
              type="button"
              className="danger-button"
              onClick={handleUnmarkLeave}
              disabled={isSubmitting}
            >
              Unmark Leave
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={handleMarkLeave}
              disabled={!availability?.isWorkingDay || isSubmitting}
            >
              Mark Leave
            </button>
          )}
          <div className="summary-pill">
            {user?.squad} | {user?.batch}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Calendar view</p>
            <h3>Upcoming working days</h3>
          </div>
          <div className="summary-pill">Selected: {availability?.selectedDate}</div>
        </div>

        <CalendarStrip dates={availability?.upcomingDates} selectedDate={selectedDate} onSelect={setSelectedDate} />
      </section>

      <section className="dashboard-grid">
        <div className="panel seat-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Seat map</p>
              <h3>50-seat live layout</h3>
            </div>
            <SeatLegend />
          </div>

          <SeatGrid seats={availability?.seats} onSeatClick={setSelectedSeat} />
        </div>

        <aside className="side-column">
          <div className="panel stat-panel">
            <p className="eyebrow">Daily snapshot</p>
            <div className="stats-grid">
              <div className="stat-card">
                <strong>{stats.booked}</strong>
                <span>Booked</span>
              </div>
              <div className="stat-card">
                <strong>{stats.available}</strong>
                <span>Available</span>
              </div>
              <div className="stat-card">
                <strong>{stats.fixed}</strong>
                <span>Fixed</span>
              </div>
              <div className="stat-card">
                <strong>{stats.floating}</strong>
                <span>Floating</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">Your booking</p>
            {availability?.userBooking ? (
              <>
                <h3>{availability.userBooking.seatLabel}</h3>
                <p className="muted-copy">Reserved for {availability.userBooking.date}</p>
              </>
            ) : (
              <>
                <h3>No booking yet</h3>
                <p className="muted-copy">Choose an eligible seat in the grid to reserve it.</p>
              </>
            )}
          </div>

          <div className="panel">
            <p className="eyebrow">Schedule rules</p>
            <ul className="info-list">
              <li>Batch day today: {availability?.designatedDay ? "Yes" : "No"}</li>
              <li>Holiday: {availability?.isHoliday ? "Yes" : "No"}</li>
              <li>Weekend: {availability?.isWeekend ? "Yes" : "No"}</li>
              <li>Leave marked: {availability?.hasLeave ? "Yes" : "No"}</li>
            </ul>
          </div>
        </aside>
      </section>

      <SeatDetailsModal
        seat={selectedSeat}
        selectedDate={selectedDate}
        canBookToday={availability?.canBookToday}
        onClose={() => setSelectedSeat(null)}
        onBook={handleBook}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default DashboardPage;
