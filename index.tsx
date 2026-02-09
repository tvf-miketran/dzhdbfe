import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryProvider } from "./store/QueryProvider";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#0f172a",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(15, 23, 42, 0.15)",
              border: "1px solid #e2e8f0",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>,
);
