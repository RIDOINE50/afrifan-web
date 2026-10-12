// app/creator/go-live/page.tsx
import { Suspense } from "react";
import GoLiveClient from "./GoLiveClient";

// ✅ Force le rendu dynamique côté serveur (interdit le pré-rendu statique)
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: "100vh",
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <p>Chargement...</p>
        </div>
      }
    >
      <GoLiveClient />
    </Suspense>
  );
}