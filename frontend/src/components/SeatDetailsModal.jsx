function SeatDetailsModal({ seat, selectedDate, canBookToday, onClose, onBook, onCancel }) {
  if (!seat) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Seat details</p>
            <h3>{seat.label}</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="modal-body">
          <p>
            <strong>Date:</strong> {selectedDate}
          </p>
          <p>
            <strong>Type:</strong> {seat.type}
          </p>
          <p>
            <strong>Assigned user:</strong> {seat.assignedUser?.name || "Not assigned"}
          </p>
          <p>
            <strong>Status:</strong> {seat.isBooked ? "Booked" : "Available"}
          </p>
          {seat.bookedBy && (
            <p>
              <strong>Booked by:</strong> {seat.bookedBy.name}
            </p>
          )}
          {seat.reasonUnavailable && (
            <div className="notice-card warning">
              <strong>Note:</strong> {seat.reasonUnavailable}
            </div>
          )}
        </div>

        <div className="modal-actions">
          {seat.canCancel && (
            <button type="button" className="danger-button" onClick={() => onCancel(seat)}>
              Cancel booking
            </button>
          )}

          {seat.canBook && (
            <button type="button" className="primary-button" onClick={() => onBook(seat)} disabled={!canBookToday}>
              {canBookToday ? "Book seat" : "Booking window closed"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SeatDetailsModal;
