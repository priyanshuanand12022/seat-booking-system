function SeatCard({ seat, onClick }) {
  const cardClass = seat.isBooked
    ? "seat-card booked"
    : seat.type === "floating"
      ? "seat-card floating"
      : seat.assignedUser
        ? "seat-card fixed"
        : "seat-card available";

  return (
    <button type="button" className={cardClass} onClick={() => onClick(seat)}>
      <span className="seat-card-label">{seat.label}</span>
      <span className="seat-card-meta">{seat.type === "floating" ? "Floating" : "Fixed"}</span>
      <span className="seat-card-status">
        {seat.isBooked
          ? "Booked"
          : seat.canBook
            ? "Tap to book"
            : seat.canCancel
              ? "Tap to cancel"
              : "View details"}
      </span>
    </button>
  );
}

export default SeatCard;
