import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Captura erros de render em qualquer parte da árvore e mostra um fallback,
 * evitando que uma falha isolada derrube a aplicação inteira (tela branca).
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro de render capturado pelo ErrorBoundary', error, info);
  }

  private handleReload = (): void => {
    this.setState({ error: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-surface px-6 text-on-surface">
          <div className="max-w-md border border-error/40 bg-surface-lowest p-8 text-center">
            <p className="text-xs font-bold text-error">Erro inesperado</p>
            <h1 className="mt-3 text-2xl font-semibold text-on-surface">Algo saiu do trilho.</h1>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              A tela encontrou um erro e foi interrompida com segurança. Recarregue para continuar a operação.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 border border-primary bg-primary px-5 py-2 text-xs font-bold text-on-primary transition hover:bg-primary"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
