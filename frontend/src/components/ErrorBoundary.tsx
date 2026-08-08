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
        <div className="grid min-h-screen place-items-center bg-[#080b08] px-6 text-stone-100">
          <div className="max-w-md border border-red-400/40 bg-[#0d120d] p-8 text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-red-400">Erro inesperado</p>
            <h1 className="mt-3 text-2xl font-black text-white">Algo saiu do trilho.</h1>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              A tela encontrou um erro e foi interrompida com segurança. Recarregue para continuar a operação.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 border border-lime-300 bg-lime-300 px-5 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#080b08] transition hover:bg-lime-200"
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
