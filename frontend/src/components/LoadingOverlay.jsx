function LoadingOverlay({ label = "Loading..." }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingOverlay;
