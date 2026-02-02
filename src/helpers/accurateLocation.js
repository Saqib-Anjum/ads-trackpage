import { Address4, Address6 } from "ip-address";

/* ---------- IP helpers ---------- */
export function validateIP(ip) {
  if (!ip) return null;
  try {
    if (Address4.isValid(ip)) return new Address4(ip).address;
    if (Address6.isValid(ip)) return new Address6(ip).canonicalForm();
  } catch (err) {
    console.warn("validateIP error:", err);
  }
  return null;
}

export async function getPublicIp(options = { serverIpEndpoint: "/api/my-ip", fallback: true }) {
  const { serverIpEndpoint, fallback } = options;
  // Try server-side first (recommended)
  if (serverIpEndpoint) {
    try {
      const r = await fetch(serverIpEndpoint, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j?.ip) return String(j.ip);
      }
    } catch (e) {
      console.warn("serverIpEndpoint failed:", e);
    }
  }
  // Fallback to ipify
  if (fallback) {
    try {
      const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j?.ip) return String(j.ip);
      }
    } catch (e) {
      console.warn("ipify failed:", e);
    }
  }
  return null;
}

/* ---------- Reverse geocode (client can call server endpoint) ---------- */
export async function reverseGeocode(lat, lon, options = { serverReverseEndpoint: "/api/reverse-geocode", fallbackToNominatim: true }) {
  const { serverReverseEndpoint, fallbackToNominatim } = options;

  if (serverReverseEndpoint) {
    try {
      const url = `${serverReverseEndpoint}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        const city = j.city || j.town || j.village || j.postal_town || null;
        const region = j.region || j.state || j.county || null;
        const country = j.country || j.country_name || null;
        const area = j.suburb || j.neighbourhood || j.district || null;
        return { city, region, country, area, raw: j, source: "server" };
      }
    } catch (e) {
      console.warn("server reverse failed:", e);
    }
  }

  if (fallbackToNominatim) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        const a = j?.address || {};
        const city = a.city || a.town || a.village || a.postcode || null;
        const region = a.state || a.county || null;
        const country = a.country || null;
        const area = a.suburb || a.neighbourhood || a.hamlet || null;
        return { city, region, country, area, raw: j, source: "nominatim" };
      }
    } catch (e) {
      console.warn("nominatim failed:", e);
    }
  }

  return null;
}

/* ---------- Build clientLocation from coords ---------- */
export function buildClientLocationFromCoords(coords) {
  if (!coords) return null;
  const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = coords;
  return {
    provider: "browser-geolocation",
    latitude: Number(latitude ?? null),
    longitude: Number(longitude ?? null),
    accuracy: typeof accuracy === "number" ? Number(accuracy) : null,
    altitude: typeof altitude === "number" ? Number(altitude) : null,
    altitudeAccuracy: typeof altitudeAccuracy === "number" ? Number(altitudeAccuracy) : null,
    heading: typeof heading === "number" ? Number(heading) : null,
    speed: typeof speed === "number" ? Number(speed) : null,
    timestamp: Date.now(),
  };
}

/* ---------- Main: assemble enriched client location ---------- */
export async function getAccurateClientLocation(options = {}) {
  const {
    coords: providedCoords = null,
    geolocationTimeout = 10000,
    serverIpEndpoint = "/api/my-ip",
    serverReverseEndpoint = "/api/reverse-geocode",
    allowNominatimFallback = true,
  } = options;

  // 1) coords (prefer provided, else navigator)
  let coords = providedCoords;
  if (!coords && "geolocation" in navigator) {
    const getPos = () =>
      new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: geolocationTimeout,
          maximumAge: 0,
        })
      );
    try {
      const pos = await getPos();
      coords = pos.coords;
    } catch (err) {
      // permission denied, timeout, etc.
      coords = null;
      console.warn("geolocation error:", err?.message ?? err);
    }
  }

  // 2) build clientLocation base
  const clientLocation = buildClientLocationFromCoords(coords) || { provider: "none", timestamp: Date.now() };

  // 3) reverse geocode if coords present
  let geoInfo = null;
  if (coords?.latitude != null && coords?.longitude != null) {
    geoInfo = await reverseGeocode(coords.latitude, coords.longitude, {
      serverReverseEndpoint,
      fallbackToNominatim: allowNominatimFallback,
    });
  }

  // 4) get IP
  const ip = await getPublicIp({ serverIpEndpoint, fallback: true });
  const ipValidated = validateIP(ip);

  // assemble
  return {
    provider: clientLocation.provider,
    latitude: clientLocation.latitude ?? null,
    longitude: clientLocation.longitude ?? null,
    accuracy: clientLocation.accuracy ?? null,
    altitude: clientLocation.altitude ?? null,
    altitudeAccuracy: clientLocation.altitudeAccuracy ?? null,
    heading: clientLocation.heading ?? null,
    speed: clientLocation.speed ?? null,
    timestamp: clientLocation.timestamp ?? Date.now(),
    ip: ip || null,
    ipValidated: ipValidated || null,
    city: geoInfo?.city || null,
    region: geoInfo?.region || null,
    country: geoInfo?.country || null,
    area: geoInfo?.area || null,
    reverseSource: geoInfo?.source || null,
    rawReverseGeocode: geoInfo?.raw || null,
  };
}

/* ---------- Convenience: send event to your lead-drafts endpoint ---------- */
export async function sendVisitEvent(payload, options = { endpoint: "https://dummydomainall-com.airx.ac/api/location" }) {
  const { endpoint } = options;
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await r.json();
  } catch (err) {
    console.error("sendVisitEvent failed:", err);
    return null;
  }
}
