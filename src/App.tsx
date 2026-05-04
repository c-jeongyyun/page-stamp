export default function App() {
  function handleClose() {
    parent.postMessage({ pluginMessage: { type: "close" } }, "*");
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: "16px" }}>
      <h2>Page Stamp</h2>
      <button onClick={handleClose}>Close</button>
    </div>
  );
}
