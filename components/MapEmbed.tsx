
import React, { useState, useEffect } from 'react';
import { MapDirectionsPayload, MapSearchPayload } from '../types';
import { ExternalLinkIcon } from './Icons';

interface MapEmbedProps {
  payload: MapDirectionsPayload | MapSearchPayload;
}

// Type guard to differentiate between payload types at runtime
function isDirectionsPayload(payload: MapDirectionsPayload | MapSearchPayload): payload is MapDirectionsPayload {
  return 'origin' in payload && 'destination' in payload;
}

const MapEmbed: React.FC<MapEmbedProps> = ({ payload }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/maps-key');
        if (!response.ok) {
          throw new Error('Failed to fetch API key');
        }
        const data = await response.json();
        setApiKey(data.apiKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };
    fetchApiKey();
  }, []);

  if (error) {
    return <div className="p-4 text-red-400 bg-red-900 border border-red-600 rounded-lg">Error: {error}</div>;
  }

  if (!apiKey) {
    return <div className="p-4 text-gray-400 bg-gray-700 border border-gray-600 rounded-lg">Loading map...</div>;
  }

  let embedUrl: string;
  let linkUrl: string;

  if (isDirectionsPayload(payload)) {
    // Handle directions request
    const { origin, destination, mode } = payload;
    embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`;
    linkUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
  } else {
    // Handle place search request
    const { query } = payload;
    embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`;
    linkUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="350"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
        className="border-0"
        title="Google Maps Embed"
      ></iframe>
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center space-x-2 w-full p-3 bg-gray-600 hover:bg-gray-500 text-gray-200 transition-colors duration-200 text-sm font-semibold"
      >
        <ExternalLinkIcon />
        <span>Open in Google Maps</span>
      </a>
    </div>
  );
};

export default MapEmbed;
