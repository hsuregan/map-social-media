"use client";

import { useEffect } from "react";
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

interface EntryMapProps {
  entries: JournalEntry[];
  currentUserId: string;
}

export default function EntryMap({ entries, currentUserId }: EntryMapProps) {
  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      className="h-[600px] w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds entries={entries} />
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
  );
}
