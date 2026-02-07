"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { JournalEntry } from "@/lib/types";
import Link from "next/link";

// Fix Leaflet default marker icon paths (known bundler issue)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ entries }: { entries: JournalEntry[] }) {
  const map = useMap();

  useEffect(() => {
    if (entries.length === 0) return;

    const bounds = L.latLngBounds(
      entries.map((e) => [e.latitude!, e.longitude!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [entries, map]);

  return null;
}

function DrawCircleSelector({
  entries,
  onSelect,
}: {
  entries: JournalEntry[];
  onSelect: (selected: JournalEntry[]) => void;
}) {
  const map = useMap();
  const [drawMode, setDrawMode] = useState(false);
  const circleRef = useRef<L.Circle | null>(null);
  const centerRef = useRef<L.LatLng | null>(null);
  const drawingRef = useRef(false);

  const clearCircle = useCallback(() => {
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
  }, []);

  const toggleDrawMode = useCallback(() => {
    setDrawMode((prev) => {
      const next = !prev;
      if (!next) {
        clearCircle();
      }
      return next;
    });
  }, [clearCircle]);

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
      clearCircle();
      centerRef.current = e.latlng;
      drawingRef.current = true;
      map.dragging.disable();

      circleRef.current = L.circle(e.latlng, {
        radius: 0,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
    };

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (!drawingRef.current || !centerRef.current || !circleRef.current)
        return;
      const radius = centerRef.current.distanceTo(e.latlng);
      circleRef.current.setRadius(radius);
    };

    const onMouseUp = () => {
      if (!drawingRef.current || !circleRef.current) return;
      drawingRef.current = false;
      map.dragging.enable();

      const circleCenter = circleRef.current.getLatLng();
      const circleRadius = circleRef.current.getRadius();

      if (circleRadius < 10) {
        clearCircle();
        return;
      }

      const inside = entries.filter((entry) => {
        if (entry.latitude == null || entry.longitude == null) return false;
        const entryLatLng = L.latLng(entry.latitude, entry.longitude);
        return circleCenter.distanceTo(entryLatLng) <= circleRadius;
      });

      setDrawMode(false);
      map.getContainer().style.cursor = "";

      if (inside.length > 0) {
        onSelect(inside);
      } else {
        clearCircle();
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
  }, [drawMode, entries, map, onSelect, clearCircle]);

  // Expose clearCircle to parent via a custom event pattern
  useEffect(() => {
    const container = map.getContainer();
    const handler = () => clearCircle();
    container.addEventListener("clear-circle", handler);
    return () => container.removeEventListener("clear-circle", handler);
  }, [map, clearCircle]);

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
          background: drawMode ? "#3b82f6" : "white",
          color: drawMode ? "white" : "#333",
          border: "2px solid rgba(0,0,0,0.2)",
          borderRadius: 4,
          padding: "6px 12px",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: "0 1px 5px rgba(0,0,0,0.15)",
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
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 8,
          padding: 24,
          maxWidth: 420,
          width: "90%",
          maxHeight: "70%",
          overflowY: "auto",
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {entries.length} {entries.length === 1 ? "Entry" : "Entries"} in
            Selection
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#666",
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
                borderBottom: "1px solid #eee",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: 15,
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
                    background: "#e0e7ff",
                    color: "#3730a3",
                    padding: "1px 8px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {entry.entry_type}
                </span>
                <span style={{ color: "#888" }}>
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
              <Link
                href={`/dashboard/entry/${entry.id}`}
                style={{
                  color: "#3b82f6",
                  fontSize: 13,
                  marginTop: 4,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                View entry &rarr;
              </Link>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "8px 0",
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

interface EntryMapProps {
  entries: JournalEntry[];
  currentUserId: string;
}

export default function EntryMap({ entries, currentUserId }: EntryMapProps) {
  const [selectedEntries, setSelectedEntries] = useState<JournalEntry[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  const handleClose = useCallback(() => {
    setSelectedEntries([]);
    if (mapRef.current) {
      mapRef.current.getContainer().dispatchEvent(new Event("clear-circle"));
    }
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[0, 0]}
        zoom={2}
        className="h-[600px] w-full rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds entries={entries} />
        <DrawCircleSelector entries={entries} onSelect={setSelectedEntries} />
        {entries.map((entry) => (
          <Marker
            key={entry.id}
            position={[entry.latitude!, entry.longitude!]}
            icon={entry.user_id === currentUserId ? blueIcon : redIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{entry.title}</p>
                <p className="text-gray-500 capitalize">{entry.entry_type}</p>
                <p className="text-gray-400">
                  {new Date(entry.created_at).toLocaleDateString()}
                </p>
                <Link
                  href={`/dashboard/entry/${entry.id}`}
                  className="text-blue-600 hover:text-blue-500"
                >
                  View entry
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {selectedEntries.length > 0 && (
        <EntrySelectionModal entries={selectedEntries} onClose={handleClose} />
      )}
    </div>
  );
}
