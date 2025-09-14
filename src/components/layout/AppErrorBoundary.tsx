import React from 'react';

interface State { hasError: boolean; error?: any; }

export class AppErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('App error boundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    try { window.location.reload(); } catch {}
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Something went wrong</h1>
          <p className="text-gray-600 mb-4">An unexpected error occurred. You can try reloading the application.</p>
          <button onClick={this.handleReload} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Reload</button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-6 text-left bg-white p-4 border rounded max-w-lg overflow-auto text-xs text-red-700 whitespace-pre-wrap">{String(this.state.error?.message || this.state.error)}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
