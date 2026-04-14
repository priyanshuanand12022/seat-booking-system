import SeatCard from "./SeatCard";

function SeatGrid({ seats = [], onSeatClick }) {
  return (
    <div className="seat-grid">
      {seats.map((seat) => (
        <SeatCard key={seat.id} seat={seat} onClick={onSeatClick} />
      ))}
    </div>
  );
}

export default SeatGrid;
