import React, { useState, useEffect, Suspense, useCallback } from "react";
import {
  registerRemotes,
  registerPlugins,
  loadRemote,
} from "@module-federation/runtime";
import { createDefaultPlugins } from "../../runtime-plugins";
import type {
  RemoteComponentProps,
  DynamicImportHook,
} from "../../types/module-federation";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, resetError: () => void) => React.ReactNode;
}

function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    resetError();
  }, [children, resetError]);

  if (error) {
    if (fallback) {
      return <>{fallback(error, resetError)}</>;
    }

    return (
      <div
        style={{
          padding: "2em",
          border: "2px solid #ff6b6b",
          borderRadius: "4px",
          backgroundColor: "#ffe0e0",
          color: "#c92a2a",
        }}
      >
        <h3>⚠️ Component Failed to Load</h3>
        <p>
          Unable to load the remote component. Please try again or check the
          remote application.
        </p>
        <details>
          <summary>Error Details</summary>
          <pre style={{ fontSize: "12px", overflow: "auto" }}>
            {error.toString()}
          </pre>
        </details>
        <button
          onClick={resetError}
          style={{
            marginTop: "1em",
            padding: "0.5em 1em",
            backgroundColor: "#c92a2a",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

const getRemoteEntry = (port: number): string => {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_REMOTE_BASE_URL || window.location.origin
      : "http://localhost";
  return `${baseUrl}:${port}/remoteEntry.js`;
};

registerPlugins(
  createDefaultPlugins({
    retry: {
      onRetry: (attempt: any, error: any, args: any) => {
        console.log(`Retrying ${args.id} (attempt ${attempt}):`, error.message);
      },
      onFailure: (error: any, args: any) => {
        console.error(`Failed to load ${args.id} after all retries:`, error);
      },
    },
    performance: {
      onSlowLoad: (loadTime: any, args: any) => {
        console.warn(`Slow load detected for ${args.id}: ${loadTime}ms`);
      },
    },
    errorBoundary: {
      onError: (errorInfo: any) => {
        // In a real app, you might send this to an error reporting service
        console.error("Module Federation Error Report:", errorInfo);
      },
    },
  })
);

function useDynamicImport({
  module,
  scope,
}: RemoteComponentProps): DynamicImportHook {
  const [component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const loadComponent = async (isRetry: boolean = false): Promise<void> => {
    if (isRetry) {
      setRetryCount((prev) => prev + 1);
    } else {
      setRetryCount(0);
    }

    setLoading(true);
    setError(null);
    if (!isRetry) setComponent(null);

    try {
      console.log(
        `Loading remote module: ${scope}/${module}${
          isRetry ? ` (retry ${retryCount + 1})` : ""
        }`
      );
      const Component = null;
      if (Component) {
        setComponent(() => Component);
      } else {
        throw new Error(
          `No default export found in remote module ${scope}/${module}`
        );
      }
      console.log(`Successfully loaded: ${scope}/${module}`);
    } catch (error) {
      console.error(`Error loading remote module ${scope}/${module}:`, error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!module || !scope) {
      setComponent(null);
      setError(null);
      setRetryCount(0);
      return;
    }

    loadComponent();
  }, [module, scope]);

  return {
    component,
    loading,
    error,
    retryCount,
    retry: () => loadComponent(true),
  };
}

function App(): JSX.Element {
  const [{ module, scope }, setSystem] = useState<
    Partial<RemoteComponentProps>
  >({});

  const setApp2 = (): void => {
    setSystem({
      scope: "app2",
      module: "Widget",
    });
  };

  const setApp3 = (): void => {
    setSystem({
      scope: "app3",
      module: "Widget",
    });
  };

  const {
    component: Component,
    loading,
    error,
    retryCount,
    retry,
  } = useDynamicImport({
    module: module || "",
    scope: scope || "",
  });

  const renderRemoteComponent = (): React.ReactNode => {
    if (loading) {
      return (
        <div
          style={{
            padding: "2em",
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            border: "2px dashed #dee2e6",
          }}
        >
          <div>
            🔄 Loading {scope}/{module}...
          </div>
          {retryCount > 0 && (
            <div
              style={{ fontSize: "0.9em", color: "#666", marginTop: "0.5em" }}
            >
              Retry attempt {retryCount}
            </div>
          )}
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{
            padding: "2em",
            border: "2px solid #ffc107",
            borderRadius: "4px",
            backgroundColor: "#fff3cd",
            color: "#856404",
          }}
        >
          <h3>⚠️ Failed to Load Remote Component</h3>
          <p>
            Could not load {scope}/{module}
          </p>
          {retryCount > 0 && (
            <p style={{ fontStyle: "italic", marginBottom: "1em" }}>
              Retry attempts: {retryCount}
            </p>
          )}
          <div style={{ marginBottom: "1em" }}>
            <button
              onClick={retry}
              disabled={loading}
              style={{
                padding: "0.5em 1em",
                backgroundColor: loading ? "#ccc" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                marginRight: "1em",
              }}
            >
              {loading ? "Retrying..." : "Retry Load"}
            </button>
          </div>
          <details>
            <summary>Error Details</summary>
            <pre
              style={{ fontSize: "12px", overflow: "auto", marginTop: "1em" }}
            >
              {error.toString()}
            </pre>
          </details>
        </div>
      );
    }

    if (Component) {
      return (
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      <h1>Dynamic System Host</h1>
      <h2>App 1</h2>
      <p>
        The Dynamic System will take advantage of Module Federation{" "}
        <strong>remotes</strong> and <strong>exposes</strong>. It will not load
        components that have already been loaded.
      </p>
      <div style={{ marginBottom: "1em" }}>
        <button
          onClick={setApp2}
          disabled={loading}
          style={{
            marginRight: "1em",
            padding: "0.5em 1em",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Load App 2 Widget
        </button>
        <button
          onClick={setApp3}
          disabled={loading}
          style={{
            padding: "0.5em 1em",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Load App 3 Widget
        </button>
      </div>
      <div style={{ marginTop: "2em" }}>
        <Suspense
          fallback={
            <div style={{ padding: "2em", textAlign: "center" }}>
              🔄 Initializing component...
            </div>
          }
        >
          {renderRemoteComponent()}
        </Suspense>
      </div>
    </div>
  );
}

export default App;
