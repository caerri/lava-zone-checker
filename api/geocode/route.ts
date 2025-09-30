import { NextRequest, NextResponse } from "next/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Keep the ArcGIS key on the server; deployment must export this env var
 * (e.g., via AWS Secrets Manager → ARCGIS_API_KEY before starting Next.js).
 */
const ARCGIS_API_KEY = process.env.ARCGIS_API_KEY;

export async function POST(request: NextRequest) {
  if (!ARCGIS_API_KEY) {
    // Fail fast if the server was started without the secret.
    console.error("Missing ARCGIS_API_KEY env variable");
    return NextResponse.json({ message: "Server not configured." }, { status: 500 });
  }

  const { address } = await request.json();

  if (!address || typeof address !== "string") {
    return NextResponse.json({ message: "Address is required." }, { status: 400 });
  }

  /**
   * ArcGIS geocoder accepts the API key as a token.
   * We grab just one best candidate to keep the payload small.
   */
  const params = new URLSearchParams({
    f: "json",
    outFields: "Match_addr,Addr_type",
    maxLocations: "1",
    singleLine: address,
    token: ARCGIS_API_KEY,
  });

  const url =
    "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?" +
    params.toString();

  const response = await fetch(url);

  if (!response.ok) {
    console.error("Geocoder failed:", response.status, await response.text());
    return NextResponse.json({ message: "Geocoding request failed." }, { status: 502 });
  }

  const data = await response.json();

  if (!data?.candidates?.length) {
    return NextResponse.json({ message: "Address not found." }, { status: 404 });
  }

  const best = data.candidates[0];

  return NextResponse.json({
    matchedAddress: best.address ?? address,
    score: best.score ?? null,
    location: {
      lat: best.location?.y ?? null,
      lng: best.location?.x ?? null,
    },
  });
}

/**
 * The POST handler accepts a JSON body with one field: { address: string }.
 * We forward that address to the ArcGIS world geocoding service, then trim
 * the response down to the most relevant data for our UI.
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { message: "Address is required." },
        { status: 400 }
      );
    }

    /**
     * Build the query string for ArcGIS. We ask for a single best match,
     * requesting the formatted address and the coordinates.
     */
    const params = new URLSearchParams({
      f: "json",
      outFields: "Match_addr,Addr_type",
      maxLocations: "1",
      singleLine: address,
    });

    const geocodeUrl =
      "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";

    /**
     * Next.js Route Handlers run on the server, so we can use the built-in fetch.
     * If ArcGIS returns a non-200 status we bubble that up as a 502 for the client.
     */
    const response = await fetch(`${geocodeUrl}?${params.toString()}`);

    if (!response.ok) {
      return NextResponse.json(
        { message: "Geocoding request failed." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data?.candidates?.length) {
      return NextResponse.json(
        { message: "Address not found." },
        { status: 404 }
      );
    }

    const best = data.candidates[0];

    /**
     * We standardize the payload so the client code stays simple.
     * ArcGIS returns { location: { x, y } } where x = longitude and y = latitude.
     */
    return NextResponse.json({
      matchedAddress: best.address ?? address,
      score: best.score ?? null,
      location: {
        lat: best.location?.y ?? null,
        lng: best.location?.x ?? null,
      },
    });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
