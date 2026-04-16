import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (
  process.env.NODE_ENV === "production" &&
  typeof window !== "undefined" &&
  "serviceWorker" in navigator
) {
  window.addEventListener("load", () => {
    const base = process.env.PUBLIC_URL || "";
    const swUrl = `${base.replace(/\/$/, "")}/sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
