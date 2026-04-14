function CalendarStrip({ dates = [], selectedDate, onSelect }) {
  return (
    <div className="calendar-strip">
      {dates.map((date) => {
        const label = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

        return (
          <button
            key={date}
            type="button"
            className={`calendar-chip ${selectedDate === date ? "active" : ""}`}
            onClick={() => onSelect(date)}
          >
            <span>{label}</span>
            <small>{date}</small>
          </button>
        );
      })}
    </div>
  );
}

export default CalendarStrip;
