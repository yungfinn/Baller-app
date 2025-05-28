import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Location } from "@shared/schema";

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

interface LocationPickerProps {
  onLocationSelect: (location: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  }) => void;
  selectedLocation?: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  } | null;
}

export default function LocationPicker({ onLocationSelect, selectedLocation }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapboxReady, setMapboxReady] = useState(false);

  // Fetch verified locations from database
  const { data: verifiedLocations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", { status: "approved" }],
    enabled: isMapVisible,
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Default to Hagerstown, MD (near Washington County Regional Park)
          setUserLocation([-77.6724, 39.6136]);
        }
      );
    } else {
      // Default location
      setUserLocation([-77.6724, 39.6136]);
    }
  }, []);

  // Initialize map when made visible
  useEffect(() => {
    if (!isMapVisible || !mapContainer.current || !userLocation) return;

    if (map.current) return; // Map already initialized

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: userLocation,
      zoom: 12,
      attributionControl: false,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add user location control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right"
    );

    // Wait for map to load before adding markers
    map.current.on("load", () => {
      addVerifiedLocationMarkers();
      setupMapClickHandler();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isMapVisible, userLocation, verifiedLocations]);

  const addVerifiedLocationMarkers = () => {
    if (!map.current) return;

    verifiedLocations.forEach((location: Location) => {
      if (location.latitude && location.longitude) {
        // Create custom marker element
        const markerElement = document.createElement("div");
        markerElement.className = "verified-location-marker";
        markerElement.style.cssText = `
          width: 32px;
          height: 32px;
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        
        const iconElement = document.createElement("div");
        iconElement.innerHTML = "📍";
        iconElement.style.fontSize = "16px";
        markerElement.appendChild(iconElement);

        // Create marker
        const marker = new mapboxgl.Marker({ element: markerElement })
          .setLngLat([parseFloat(location.longitude), parseFloat(location.latitude)])
          .addTo(map.current!);

        // Add popup with location details
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${location.name}</h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${location.address}</p>
            <button 
              onclick="window.selectVerifiedLocation('${location.id}')" 
              style="
                background: #ef4444; 
                color: white; 
                border: none; 
                padding: 6px 12px; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
                width: 100%;
              "
            >
              Select This Location
            </button>
          </div>
        `);

        marker.setPopup(popup);

        // Handle marker click
        markerElement.addEventListener("click", () => {
          onLocationSelect({
            name: location.name,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
          });
          setIsMapVisible(false);
        });
      }
    });

    // Global function for popup button clicks
    (window as any).selectVerifiedLocation = (locationId: string) => {
      const location = verifiedLocations.find((loc: Location) => loc.id.toString() === locationId);
      if (location) {
        onLocationSelect({
          name: location.name,
          address: location.address,
          latitude: location.latitude!,
          longitude: location.longitude!,
        });
        setIsMapVisible(false);
      }
    };
  };

  const setupMapClickHandler = () => {
    if (!map.current) return;

    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      
      try {
        // Reverse geocode to get address
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const place = data.features[0];
          const address = place.place_name;
          
          // Extract location name (usually the first component)
          const locationName = place.text || "Custom Location";
          
          onLocationSelect({
            name: locationName,
            address: address,
            latitude: lat.toString(),
            longitude: lng.toString(),
          });
          setIsMapVisible(false);
        }
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
        // Fallback to coordinates
        onLocationSelect({
          name: "Custom Location",
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          latitude: lat.toString(),
          longitude: lng.toString(),
        });
        setIsMapVisible(false);
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Location Display / Trigger */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Event Location</label>
        
        {selectedLocation ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedLocation.name}</p>
                    <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMapVisible(true)}
                    className="text-xs"
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onLocationSelect({ name: "", address: "", latitude: "", longitude: "" })}
                    className="text-xs p-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsMapVisible(true)}
            className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
          >
            <Search className="w-4 h-4 mr-2" />
            Select Location on Map
          </Button>
        )}
      </div>

      {/* Fullscreen Map Modal */}
      {isMapVisible && (
        <div className="fixed inset-0 z-50 bg-white">
          {/* Map Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Choose Location</h2>
                <p className="text-sm text-gray-600">Tap a pin or anywhere on the map</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMapVisible(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative h-full">
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Map Instructions */}
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm flex-shrink-0"></div>
                    <span>Red pins are verified locations • Tap anywhere to drop a custom pin</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}