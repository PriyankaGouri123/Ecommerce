import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", fontFamily: "monospace", background: "#1e1e2e", color: "#f5f5f5", minHeight: "100vh" }}>
          <h1 style={{ color: "#ff6b6b", fontSize: "24px", marginBottom: "16px" }}>⚠️ Something went wrong</h1>
          <div style={{ background: "#2d2d3f", padding: "20px", borderRadius: "8px", marginBottom: "16px", overflowX: "auto" }}>
            <h3 style={{ color: "#ffa94d", marginBottom: "8px" }}>Error:</h3>
            <pre style={{ color: "#ff6b6b", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>
          <div style={{ background: "#2d2d3f", padding: "20px", borderRadius: "8px", overflowX: "auto" }}>
            <h3 style={{ color: "#ffa94d", marginBottom: "8px" }}>Component Stack:</h3>
            <pre style={{ color: "#a9b1d6", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "12px" }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "20px", padding: "10px 24px", background: "#4c6ef5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
