import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  handleResetStorage = () => {
    localStorage.removeItem('mis_module_hours');
    localStorage.removeItem('mis_module_assessments');
    localStorage.removeItem('mis_schedule_overrides');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050810] text-on-surface p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-error/15 border border-error/30 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <h2 className="text-xl font-bold font-headline-md">Something went wrong rendering this page.</h2>
          <p className="text-xs text-on-surface-variant max-w-md">
            {this.state.error?.toString() || "An unexpected rendering error occurred."}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="btn-electric px-4 py-2 rounded-xl text-xs font-label-bold cursor-pointer"
            >
              🔄 Reload Page
            </button>
            <button
              onClick={this.handleResetStorage}
              className="px-4 py-2 rounded-xl border border-white/10 bg-surface-container text-xs font-label-bold cursor-pointer hover:bg-white/5"
            >
              ⚙️ Reset Local Cache
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
