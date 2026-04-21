import { Component } from 'react';

/**
 * Capture les erreurs de rendu dans l'arbre enfant et affiche
 * un écran de repli au lieu de planter toute l'application.
 *
 * Usage :
 *   <ErrorBoundary label="Graphique">
 *     <TradingChart ... />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? 'Erreur inconnue' };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary — ${this.props.label ?? 'section'}]`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        backgroundColor: 'var(--bg1)', border: '1px solid #ef535040',
        borderRadius: '12px', padding: '32px', textAlign: 'center',
        color: 'var(--text3)', fontSize: '13px',
      }}>
        <div style={{ fontSize: '22px', marginBottom: '8px' }}>⚠</div>
        <div style={{ color: '#ef5350', fontWeight: 'bold', marginBottom: '6px' }}>
          {this.props.label ? `Erreur dans "${this.props.label}"` : 'Une erreur est survenue'}
        </div>
        <div style={{ fontSize: '11px', opacity: 0.7 }}>{this.state.message}</div>
        <button
          onClick={() => this.setState({ hasError: false, message: null })}
          style={{
            marginTop: '14px', padding: '6px 16px', cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text3)', borderRadius: '6px', fontSize: '12px',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
