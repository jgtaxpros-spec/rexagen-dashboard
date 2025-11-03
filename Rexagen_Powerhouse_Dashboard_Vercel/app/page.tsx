"use client";
import RexagenPowerhouseDashboard from "@/src/rexagen_powerhouse_dashboard";
import { useEffect } from "react";
import { startBrowserHeartbeat } from "@/src/services/scheduler";

export default function Page() {
  useEffect(() => {
    const stop = startBrowserHeartbeat();
    return () => stop();
  }, []);
  return <RexagenPowerhouseDashboard />;
}
