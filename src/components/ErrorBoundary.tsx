/**
 * Error Boundary Component
 * Catches React errors and prevents app crashes
 * Displays user-friendly error message with recovery options
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    console.error('🔴 Error Boundary caught an error:', error, errorInfo);

    // Save error info to state
    this.state = {
      hasError: true,
      error,
      errorInfo,
    };

    // SECURITY: Save any unsaved work to localStorage before crash
    try {
      const currentState = localStorage.getItem('woujamind_current_sprite');
      if (currentState) {
        const timestamp = new Date().toISOString();
        localStorage.setItem(`woujamind_crash_backup_${timestamp}`, currentState);
        console.log('💾 Saved backup of current work to localStorage');
      }
    } catch (err) {
      console.error('Failed to save crash backup:', err);
    }

    // TODO: Send error to monitoring service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    // Clear error state and go to home page
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  getReportBugUrl = (): string => {
    const { error, errorInfo } = this.state;
    const errorMessage = error?.message || 'Unknown error';
    const stack = error?.stack || 'No stack trace';
    const componentStack = errorInfo?.componentStack || 'No component stack';

    const bugReport = encodeURIComponent(`
**Error Message:** ${errorMessage}

**Stack Trace:**
\`\`\`
${stack}
\`\`\`

**Component Stack:**
\`\`\`
${componentStack}
\`\`\`

**Browser:** ${navigator.userAgent}
**Timestamp:** ${new Date().toISOString()}
    `.trim());

    return `https://github.com/YOUR_USERNAME/woujamind/issues/new?title=App%20Crash&body=${bugReport}`;
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxWidth: '600px',
            width: '100%',
            padding: '40px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <AlertTriangle size={40} color="#dc2626" />
            </div>

            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 12px',
            }}>
              Oops! Something went wrong
            </h1>

            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: '0 0 24px',
              lineHeight: '1.6',
            }}>
              Don't worry! We've automatically saved your work. You can try reloading the page or returning to the home screen.
            </p>

            {/* Error Details (collapsed by default) */}
            <details style={{
              background: '#f3f4f6',
              borderRadius: '8px',
              padding: '16px',
              margin: '0 0 24px',
              textAlign: 'left',
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Error Details (for debugging)
              </summary>
              <pre style={{
                fontSize: '12px',
                color: '#dc2626',
                background: '#fef2f2',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                margin: '8px 0 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error?.message}
              </pre>
            </details>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#5568d3'}
                onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
              >
                <RefreshCw size={18} />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
              >
                <Home size={18} />
                Go Home
              </button>

              <a
                href={this.getReportBugUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                Report Bug
              </a>
            </div>

            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              margin: '24px 0 0',
            }}>
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
