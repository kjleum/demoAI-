import "./app/styles.css";
import "./shared/ui/skeleton.css";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initSentry } from "./lib/sentry/initSentry";

initSentry();

// Optional MSW (mock backend): localStorage["msw:enabled"]="1"
import("./mocks/startMsw").then((m)=>m.maybeStartMsw()).catch(()=>{});

const el = document.getElementById("root");
if (!el) throw new Error("#root not found");

createRoot(el).render(<App />);
