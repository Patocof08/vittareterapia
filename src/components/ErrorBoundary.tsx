import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Algo salió mal
            </h1>
            <p className="text-muted-foreground mb-8">
              Ocurrió un error inesperado. Puedes intentar recargar la página o volver al inicio.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = "/";
                }}
              >
                Ir al inicio
              </Button>
              <Button onClick={() => window.location.reload()}>
                Recargar página
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-8">
              Si el problema persiste, escríbenos a{" "}
              <a href="mailto:contacto@vittareterapia.com" className="text-primary hover:underline">
                contacto@vittareterapia.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
