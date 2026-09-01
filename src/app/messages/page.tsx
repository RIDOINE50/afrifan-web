"use client";

import { Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import MessagesContent from "@/components/MessagesContent";

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A", color: "#FFFFFF" }}>
          Chargement des messages...
        </div>
      }>
        <MessagesContent />
      </Suspense>
    </DashboardLayout>
  );
}