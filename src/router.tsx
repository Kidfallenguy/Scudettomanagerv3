import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

const CHUNK_RECOVERY_KEY = "scudetto:chunk-recovery-at";

if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    const lastRecovery = Number(window.sessionStorage.getItem(CHUNK_RECOVERY_KEY));
    const elapsed = Date.now() - lastRecovery;

    if (Number.isFinite(lastRecovery) && lastRecovery > 0 && elapsed >= 0 && elapsed < 30_000) {
      return;
    }

    event.preventDefault();
    window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, String(Date.now()));
    window.location.reload();
  });
}

export function getRouter() {
  return createRouter({ routeTree, defaultErrorComponent: AppErrorComponent });
}
