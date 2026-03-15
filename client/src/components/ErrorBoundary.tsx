import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#1a120e] p-6 text-center">
          <p className="text-brass font-ancient text-lg uppercase tracking-widest mb-4">
            Something went wrong
          </p>
          <p className="text-cream-dark/70 text-sm max-w-md mb-8">
            The app hit an error. Reload the page to continue playing.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-brass text-black font-ancient font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
