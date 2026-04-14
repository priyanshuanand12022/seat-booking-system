const items = [
  { label: "Booked", className: "legend-booked" },
  { label: "Fixed Seat", className: "legend-fixed" },
  { label: "Floating Seat", className: "legend-floating" },
  { label: "Available", className: "legend-available" },
];

function SeatLegend() {
  return (
    <div className="legend-row">
      {items.map((item) => (
        <div key={item.label} className="legend-item">
          <span className={`legend-swatch ${item.className}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default SeatLegend;
