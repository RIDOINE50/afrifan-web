import { Suspense } from "react";
import LiveViewerClient from "./LiveViewerClient";

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
          Chargement du live...
        </div>
      }
    >
      <LiveViewerClient />
    </Suspense>
  );
}