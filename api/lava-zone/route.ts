import { NextRequest, NextResponse } from "next/server";

const ARCGIS_API_KEY = process.env.ARCGIS_API_KEY;

export async function POST(request: NextRequest) {
  if (!ARCGIS_API_KEY) {
    console.error("Missing ARCGIS_API_KEY env variable");
    return NextResponse.json({ message: "Server not configured." }, { status: 500 });
  }

  const { lat, lng, matchedAddress } = await request.json();

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { message: "Latitude and longitude are required." },
      { status: 400 }
    );
  }

  /**
   * Hawaii’s feature service uses the same ArcGIS token.
   * We query with a point geometry in WGS84 (wkid 4326) and
   * ask for attributes only (no polygon geometry) to keep responses fast.
   */
  const geometry = JSON.stringify({
    x: lng,
    y: lat,
    spatialReference: { wkid: 4326 },
  });

  const params = new URLSearchParams({
    f: "json",
    geometry,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
    token: ARCGIS_API_KEY,
  });

  const url =
    "https://geoportal.hawaii.gov/datasets/volcano-lava-flow-hazard-zones-line/api/featureServer/0/query?" +
    params.toString();

  const response = await fetch(url);

  if (!response.ok) {
    console.error("Lava-zone request failed:", response.status, await response.text());
    return NextResponse.json({ message: "Lava zone lookup failed." }, { status: 502 });
  }

  const data = await response.json();
  const attributes = data?.features?.[0]?.attributes;

  return NextResponse.json({
    matchedAddress: matchedAddress ?? null,
    zoneId: attributes?.ZONE ?? null,
    description: attributes?.ZONE_DESC ?? null,
    volcano: attributes?.VOLCANO ?? null,
  });
}
