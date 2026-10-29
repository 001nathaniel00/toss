import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TossApp } from "./TossApp";
import "./toss.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TossApp />
  </StrictMode>,
);
