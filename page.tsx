"use client";
// Next.js needs this hint because we use hooks and event handlers on the client side.

import { useState } from "react";
// React hook for local component state.

import AddressForm from "./components/AddressForm";
// Form component you just built.

import ResultPanel, { LavaZoneResult } from "./components/ResultPanel";
// Result display plus the result type definition.

type RequestStatus = "idle" | "loading" | "error" | "success";
// Narrow string union keeps status values predictable and type-safe.

export default function LavaZoneCheckerPage() {
  const [status, setStatus] = useState<RequestStatus>("idle");
  // Tracks the current phase of the lookup workflow.

  const [error, setError] = useState<string | null>(null);
  // Holds a human-readable error when something fails.

  const [result, setResult] = useState<LavaZoneResult | null>(null);
  // Stores the zone data once everything succeeds.

  /**
   * Called when AddressForm submits an address.
   * We clear previous output, flip status to loading, and then call our API routes.
   */
  const handleLookup = async (address: string) => {
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const geocodeResponse = await fetch("/lava-zone-checker/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!geocodeResponse.ok) {
        throw new Error("Address lookup failed. Double-check the address.");
      }

      const geocodeData = await geocodeResponse.json();

      if (!geocodeData?.location) {
        throw new Error("No coordinates returned for that address.");
      }

      const zoneResponse = await fetch("/lava-zone-checker/api/lava-zone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: geocodeData.location.lat,
          lng: geocodeData.location.lng,
          matchedAddress: geocodeData.matchedAddress ?? address,
        }),
      });

      if (!zoneResponse.ok) {
        throw new Error("Could not retrieve lava zone information.");
      }

      const zoneData: LavaZoneResult = await zoneResponse.json();

      setResult(zoneData);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unexpected error.");
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>Lava Zone Checker</h1>
      <p>Enter a Hawaiʻi address to see its lava flow hazard zone.</p>

      <AddressForm onSubmit={handleLookup} submitting={status === "loading"} />

      <ls status={status} error={error} result={result} />
    </main>
  );
}
