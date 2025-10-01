/**
 * LavaZoneResult describes the successful payload we expect from the lava zone API.
 * Each property is marked optional/nullable because the service might omit fields
 * when an address falls outside the mapped zones or an attribute is missing.
 */
export interface LavaZoneResult {
  matchedAddress: string | null;
  zoneId: string | null;
  description: string | null;
  volcano: string | null;
}

/**
 * ResultPanelProps defines what the parent page will pass into this component.
 * - status tells us which UI state to render (idle, loading, error, success).
 * - error carries a human-friendly message supplied by the parent when something fails.
 * - result holds the actual zone data (or null while we wait / if none was found).
 */
interface ResultPanelProps {
  status: "idle" | "loading" | "error" | "success";
  error: string | null;
  result: LavaZoneResult | null;
}

/**
 * ResultPanel is a presentational component: it never fetches data on its own.
 * Instead, it receives the status/error/result trio and chooses which message or
 * data layout to display. This keeps our UI predictable and easy to test.
 */
export default function ResultPanel({ status, error, result }: ResultPanelProps) {
  // When nothing has happened yet, we invite the user to start with a friendly prompt.
  if (status === "idle") {
    return (
      <section style={{ marginTop: "2rem" }}>
        <p>Enter an address to get started.</p>
      </section>
    );
  }

  // While an API request is running, we reassure the user that work is in progress.
  if (status === "loading") {
    return (
      <section style={{ marginTop: "2rem" }}>
        <p>Fetching lava zone information…</p>
      </section>
    );
  }

  // If the parent encountered an error (network, validation, etc.), we surface it in red.
  if (status === "error") {
    return (
      <section style={{ marginTop: "2rem", color: "#c0392b" }}>
        <p>{error ?? "Something went wrong. Please try again."}</p>
      </section>
    );
  }

  /**
   * At this point status is "success". If result is still null, that means the lookup
   * completed but the API didn’t return any matching zone. We handle that gracefully
   * so the user knows the request finished even though no data was available.
   */
  if (!result) {
    return (
      <section style={{ marginTop: "2rem" }}>
        <p>No lava zone information was returned for that location. Try another address.</p>
      </section>
    );
  }

  /**
   * Success case: we have a populated LavaZoneResult object and can show it in a mini report.
   * A definition list (<dl>) is semantically appropriate for label/value pairs and works well
   * with screen readers, keeping the UI accessible as we grow the feature.
   */
  return (
    <section style={{ marginTop: "2rem" }}>
      <h2>Lava Zone Details</h2>

      <dl style={{ marginTop: "1rem" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <dt>Matched address</dt>
          <dd>{result.matchedAddress ?? "Not provided."}</dd>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <dt>Zone</dt>
          <dd>{result.zoneId ?? "Unknown"}</dd>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <dt>Description</dt>
          <dd>{result.description ?? "No description available."}</dd>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <dt>Volcano</dt>
          <dd>{result.volcano ?? "Not specified."}</dd>
        </div>
      </dl>
    </section>
  );
}
