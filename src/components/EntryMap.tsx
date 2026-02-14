"use client";

import { useEffect, useState, useCallback, useRef, memo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { JournalEntry } from "@/lib/types";
import { pointInPolygon } from "@/lib/geo";
import Link from "next/link";

// Inline SVG marker icons to eliminate external CDN requests
function markerSvg(fill: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 2.4.7 4.7 1.9 6.6L12.5 41l10.6-21.9c1.2-1.9 1.9-4.2 1.9-6.6C25 5.6 19.4 0 12.5 0z" fill="${fill}" stroke="#fff" stroke-width="1"/><circle cx="12.5" cy="12.5" r="5" fill="#fff"/></svg>`
  )}`;
}

const shadowSvg = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="41" height="41" viewBox="0 0 41 41"><ellipse cx="13" cy="38" rx="13" ry="3" fill="rgba(0,0,0,0.2)"/></svg>`
)}`;

// Fix Leaflet default marker icon paths (known bundler issue)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerSvg("#B85C38"),
  iconRetinaUrl: markerSvg("#B85C38"),
  shadowUrl: shadowSvg,
});

const accentIcon = new L.Icon({
  iconUrl: markerSvg("#B85C38"),
  shadowUrl: shadowSvg,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: markerSvg("#8B3A2F"),
  shadowUrl: shadowSvg,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const badgeColors: Record<string, { bg: string; fg: string }> = {
  text: { bg: "#E8E0D4", fg: "#6B5D4F" },
  audio: { bg: "#E4D5E8", fg: "#6B4F7A" },
  picture: { bg: "#D6E4D4", fg: "#4F6B4D" },
  video: { bg: "#E8DDD0", fg: "#7A6442" },
};

function FitBounds({ entries }: { entries: JournalEntry[] }) {
  const map = useMap();

  useEffect(() => {
    if (entries.length === 0) return;

    const bounds = L.latLngBounds(
      entries.map((e) => [e.latitude!, e.longitude!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
  }, [entries, map]);

  return null;
}

function DrawLassoSelector({
  entries,
  onSelect,
}: {
  entries: JournalEntry[];
  onSelect: (selected: JournalEntry[]) => void;
}) {
  const map = useMap();
  const [drawMode, setDrawMode] = useState(false);
  const polygonRef = useRef<L.Polygon | null>(null);
  const pointsRef = useRef<L.LatLng[]>([]);
  const drawingRef = useRef(false);

  const clearShape = useCallback(() => {
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }
    pointsRef.current = [];
  }, []);

  const toggleDrawMode = useCallback(() => {
    setDrawMode((prev) => {
      const next = !prev;
      if (!next) {
        clearShape();
      }
      return next;
    });
  }, [clearShape]);

  useEffect(() => {
    const container = map.getContainer();
    if (drawMode) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }
  }, [drawMode, map]);

  useEffect(() => {
    if (!drawMode) return;

    const onMouseDown = (e: L.LeafletMouseEvent) => {
      clearShape();
      pointsRef.current = [e.latlng];
      drawingRef.current = true;
      map.dragging.disable();

      polygonRef.current = L.polygon([e.latlng], {
        color: "#B85C38",
        fillColor: "#B85C38",
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
    };

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (!drawingRef.current || !polygonRef.current) return;
      pointsRef.current.push(e.latlng);
      polygonRef.current.setLatLngs(pointsRef.current);
    };

    const onMouseUp = () => {
      if (!drawingRef.current || !polygonRef.current) return;
      drawingRef.current = false;
      map.dragging.enable();

      const points = pointsRef.current;
      if (points.length < 3) {
        clearShape();
        return;
      }

      // Close the polygon visually
      polygonRef.current.setLatLngs(points);

      const inside = entries.filter((entry) => {
        if (entry.latitude == null || entry.longitude == null) return false;
        return pointInPolygon(entry.latitude, entry.longitude, points);
      });

      setDrawMode(false);
      map.getContainer().style.cursor = "";

      if (inside.length > 0) {
        onSelect(inside);
      } else {
        clearShape();
      }
    };

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    return () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
    };
  }, [drawMode, entries, map, onSelect, clearShape]);

  // Expose clearShape to parent via a custom event
  useEffect(() => {
    const container = map.getContainer();
    const handler = () => clearShape();
    container.addEventListener("clear-shape", handler);
    return () => container.removeEventListener("clear-shape", handler);
  }, [map, clearShape]);

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1000,
      }}
    >
      <button
        onClick={toggleDrawMode}
        style={{
          background: drawMode ? "#B85C38" : "#F5F0E8",
          color: drawMode ? "white" : "#2C2825",
          border: "2px solid rgba(44,40,37,0.15)",
          borderRadius: 4,
          padding: "6px 12px",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: "0 1px 5px rgba(44,40,37,0.15)",
        }}
      >
        {drawMode ? "Cancel" : "Select Area"}
      </button>
    </div>
  );
}

function EntrySelectionModal({
  entries,
  onClose,
}: {
  entries: JournalEntry[];
  onClose: () => void;
}) {
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(44,40,37,0.4)",
      }}
    >
      <div
        style={{
          background: "#F5F0E8",
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          width: "90%",
          maxHeight: "70%",
          overflowY: "auto",
          boxShadow: "0 8px 30px rgba(44,40,37,0.2)",
        }}
      >
        {viewingEntry ? (
          /* ── Entry detail view ── */
          <>
            <button
              onClick={() => setViewingEntry(null)}
              style={{
                background: "none",
                border: "none",
                color: "#B85C38",
                cursor: "pointer",
                fontSize: 14,
                padding: 0,
                marginBottom: 12,
              }}
            >
              &larr; Back to list
            </button>

            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#2C2825" }}>
              {viewingEntry.title}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8C857B" }}>
              {date(viewingEntry.created_at)}
            </p>

            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
              }}
            >
              <span
                style={{
                  background: "#E8E0D4",
                  color: "#6B5D4F",
                  padding: "1px 8px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {viewingEntry.entry_type}
              </span>
              {viewingEntry.public && (
                <span
                  style={{
                    background: "#DDE8D6",
                    color: "#3D6B35",
                    padding: "1px 8px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Public
                </span>
              )}
            </div>

            {viewingEntry.latitude != null && viewingEntry.longitude != null && (
              <p style={{ fontSize: 13, color: "#8C857B", marginTop: 12 }}>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${viewingEntry.latitude}&mlon=${viewingEntry.longitude}#map=15/${viewingEntry.latitude}/${viewingEntry.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#B85C38", textDecoration: "none" }}
                >
                  {viewingEntry.latitude.toFixed(4)},{" "}
                  {viewingEntry.longitude.toFixed(4)}
                </a>
              </p>
            )}

            {viewingEntry.entry_type === "text" && viewingEntry.text_content && (
              <p
                style={{
                  marginTop: 16,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#2C2825",
                  whiteSpace: "pre-wrap",
                }}
              >
                {viewingEntry.text_content}
              </p>
            )}

            {viewingEntry.entry_type !== "text" && (
              <p style={{ marginTop: 16, fontSize: 13, color: "#5C564E" }}>
                This entry contains {viewingEntry.entry_type} media.{" "}
                <Link
                  href={`/dashboard/entry/${viewingEntry.id}`}
                  style={{ color: "#B85C38", textDecoration: "none" }}
                >
                  Open full entry &rarr;
                </Link>
              </p>
            )}

            <button
              onClick={onClose}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "8px 0",
                background: "#EDE8DF",
                border: "1px solid #D4CFC6",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                color: "#2C2825",
              }}
            >
              Close
            </button>
          </>
        ) : (
          /* ── Entry list view ── */
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#2C2825" }}>
                {entries.length}{" "}
                {entries.length === 1 ? "Entry" : "Entries"} in Selection
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#5C564E",
                  lineHeight: 1,
                  padding: "0 4px",
                }}
              >
                &times;
              </button>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #EDE8DF",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#2C2825",
                    }}
                  >
                    {entry.title}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                      fontSize: 13,
                    }}
                  >
                    <span
                      style={{
                        background: "#E8E0D4",
                        color: "#6B5D4F",
                        padding: "1px 8px",
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {entry.entry_type}
                    </span>
                    <span style={{ color: "#8C857B" }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setViewingEntry(entry)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#B85C38",
                      fontSize: 13,
                      marginTop: 4,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    View entry &rarr;
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={onClose}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "8px 0",
                background: "#EDE8DF",
                border: "1px solid #D4CFC6",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                color: "#2C2825",
              }}
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const EntryMarkers = memo(function EntryMarkers({
  entries,
  currentUserId,
  mediaUrls,
  setMarkerRef,
}: {
  entries: JournalEntry[];
  currentUserId: string;
  mediaUrls: Record<string, string>;
  setMarkerRef: (id: string, marker: L.Marker | null) => void;
}) {
  return (
    <>
      {entries.map((entry) => {
        const badge = badgeColors[entry.entry_type] ?? badgeColors.text;
        const mediaUrl = mediaUrls[entry.id];
        const shortDate = new Date(entry.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <Marker
            key={entry.id}
            position={[entry.latitude!, entry.longitude!]}
            icon={entry.user_id === currentUserId ? accentIcon : redIcon}
            ref={(marker) => setMarkerRef(entry.id, marker)}
          >
            <Popup>
              <div style={{ minWidth: 200, maxWidth: 240 }}>
                {/* Image preview for picture entries */}
                {entry.entry_type === "picture" && mediaUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl}
                    alt={entry.title}
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}

                {/* Video preview for video entries */}
                {entry.entry_type === "video" && mediaUrl && (
                  <div style={{ position: "relative", width: "100%", height: 140 }}>
                    <video
                      muted
                      preload="metadata"
                      style={{
                        width: "100%",
                        height: 140,
                        objectFit: "cover",
                        display: "block",
                      }}
                    >
                      <source src={mediaUrl} />
                    </video>
                    {/* Play icon overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.2)",
                        pointerEvents: "none",
                      }}
                    >
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="18" fill="rgba(255,255,255,0.85)" />
                        <polygon points="14,11 27,18 14,25" fill="#2C2825" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Content area with padding */}
                <div style={{ padding: "10px 14px 12px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      fontSize: 14,
                      letterSpacing: "-0.01em",
                      color: "#2C2825",
                      lineHeight: 1.3,
                    }}
                  >
                    {entry.title}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.fg,
                        padding: "1px 8px",
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {entry.entry_type}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#8C857B",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {shortDate}
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/entry/${entry.id}?from=map`}
                    style={{
                      display: "inline-block",
                      marginTop: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#B85C38",
                      textDecoration: "none",
                    }}
                  >
                    View entry &rarr;
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
});

function AutoOpenPopup({
  popupEntryId,
  markerRefsMap,
}: {
  popupEntryId: string;
  markerRefsMap: React.RefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    // Wait for markers to mount
    const timer = setTimeout(() => {
      const marker = markerRefsMap.current?.get(popupEntryId);
      if (!marker) return;

      const latLng = marker.getLatLng();
      map.flyTo(latLng, 18, { duration: 1.2 });

      // After flight completes, open the popup
      const popupTimer = setTimeout(() => {
        marker.openPopup();
      }, 1300);

      return () => clearTimeout(popupTimer);
    }, 500);

    return () => clearTimeout(timer);
  }, [popupEntryId, markerRefsMap, map]);

  return null;
}

interface EntryMapProps {
  entries: JournalEntry[];
  currentUserId: string;
  mediaUrls: Record<string, string>;
  popupEntryId: string | null;
}

export default function EntryMap({ entries, currentUserId, mediaUrls, popupEntryId }: EntryMapProps) {
  const [selectedEntries, setSelectedEntries] = useState<JournalEntry[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefsMap = useRef(new Map<string, L.Marker>());

  const setMarkerRef = useCallback((id: string, marker: L.Marker | null) => {
    if (marker) {
      markerRefsMap.current.set(id, marker);
    } else {
      markerRefsMap.current.delete(id);
    }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedEntries([]);
    if (mapRef.current) {
      mapRef.current.getContainer().dispatchEvent(new Event("clear-shape"));
    }
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[0, 0]}
        zoom={2}
        className="h-[600px] w-full rounded-xl"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds entries={entries} />
        <DrawLassoSelector entries={entries} onSelect={setSelectedEntries} />
        <MarkerClusterGroup
          chunkedLoading
          disableClusteringAtZoom={18}
          maxClusterRadius={40}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount();
            return L.divIcon({
              html: `<div style="
                background:#B85C38;
                color:#fff;
                border-radius:50%;
                width:36px;
                height:36px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:14px;
                font-weight:700;
                box-shadow:0 2px 6px rgba(44,40,37,0.3);
                border:2px solid #fff;
              ">${count}</div>`,
              className: "",
              iconSize: L.point(36, 36),
            });
          }}
        >
          <EntryMarkers
            entries={entries}
            currentUserId={currentUserId}
            mediaUrls={mediaUrls}
            setMarkerRef={setMarkerRef}
          />
        </MarkerClusterGroup>
        {popupEntryId && (
          <AutoOpenPopup popupEntryId={popupEntryId} markerRefsMap={markerRefsMap} />
        )}
      </MapContainer>
      {selectedEntries.length > 0 && (
        <EntrySelectionModal entries={selectedEntries} onClose={handleClose} />
      )}
    </div>
  );
}
