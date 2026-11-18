import { useCallback, useState } from "react";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { ExternalLink, MapPin } from "lucide-react";
import { BUSINESS_INFO } from "../data/venueData";
import { Button } from "./ui/button";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

function VenueMarkerWithInfo() {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);

  const handleClose = useCallback(() => setInfoOpen(false), []);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={BUSINESS_INFO.coordinates}
        onClick={() => setInfoOpen(true)}
        title="Vishnu Priya Function Hall, Eluru"
      >
        <Pin
          background="#6B1426"
          borderColor="#4E0D1B"
          glyphColor="#FBF8F3"
          scale={1.15}
        />
      </AdvancedMarker>
      {infoOpen && marker && (
        <InfoWindow anchor={marker} maxWidth={260} onCloseClick={handleClose}>
          <div className="p-1 text-[#231917]">
            <p className="font-semibold text-sm text-[#6B1426]">
              Vishnu Priya Function Hall
            </p>
            <p className="text-xs text-[#665851] mt-1 leading-relaxed">
              Tilak Colony, Santosh Nagar, Eluru, AP 534002
            </p>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=16.7107,81.0952"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#6B1426] underline"
            >
              Get Directions <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function VenueMap() {
  const directionsUrl =
    "https://www.google.com/maps/search/?api=1&query=Vishnu+Priya+Function+Hall+Tilak+Colony+Santosh+Nagar+Eluru";

  if (!MAPS_API_KEY) {
    return (
      <div className="flex h-[380px] w-full flex-col items-center justify-center rounded-lg border border-[#E5DAC8] bg-[#F3ECE0] p-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#D8CBB8] bg-[#FFFDF9] text-[#6B1426]">
          <MapPin className="h-6 w-6" />
        </div>
        <h3 className="font-display text-2xl font-semibold text-[#231917]">
          Vishnu Priya Function Hall
        </h3>
        <p className="mt-2 max-w-md text-sm text-[#665851]">
          {BUSINESS_INFO.address}
        </p>
        <p className="mt-1 font-mono text-xs text-[#665851] tabular-nums">
          16.7107° N, 81.0952° E
        </p>
        <Button asChild variant="default" size="sm" className="mt-5">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[380px] w-full overflow-hidden rounded-lg border border-[#E5DAC8]">
      <APIProvider apiKey={MAPS_API_KEY} libraries={["marker"]} language="en" region="IN">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={BUSINESS_INFO.coordinates}
          defaultZoom={15}
          gestureHandling="cooperative"
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          style={{ width: "100%", height: "100%" }}
        >
          <VenueMarkerWithInfo />
        </Map>
      </APIProvider>
    </div>
  );
}
