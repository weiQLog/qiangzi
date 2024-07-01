'use client';
import { LargeBox } from "@/components/widget/widget";
import { Poi, PoiMarkers } from "@/components/PoiMarkers";
import {
  APIProvider,
  Map,
  MapCameraChangedEvent
} from '@vis.gl/react-google-maps';
import { useEffect, useState } from "react";
import { getAllMapPhotos } from "@/services/photoIp";

export default function MapPhotos(){
  const [locations, setLocations] = useState<Poi[]>([])

  useEffect(()  => {
    getAllMapPhotos().then(res => {
      const locations: Poi[] = res.map(mapPhotosIp => {
        let location:google.maps.LatLngLiteral = {
          lat: Number(mapPhotosIp.latitude) || 0,
          lng: Number(mapPhotosIp.longitude) || 0
        }
        const poi: Poi = {
          key: mapPhotosIp.ip,
          photoUrl: mapPhotosIp.photo_url,
          location 
        };
        return poi;
      })
      console.log('locations', locations);
      setLocations(locations);
    });
  }, []);
  let key = process.env.NEXT_PUBLIC_GMAP_API_KEY as string;
  return (
    <LargeBox>
    <APIProvider apiKey={ key } onLoad={() => console.log('Maps API has loaded.')}>
      <Map
        defaultZoom={16}
        defaultCenter={ locations.length > 0 ? { lat: locations[0].location.lat, lng: locations[0].location.lng }: { lat: 25.03369, lng: 121.564128}}
        onCameraChanged={ (ev: MapCameraChangedEvent) =>
          console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
        }
        mapId='da37f3254c6a6d1c'
        >
          <PoiMarkers pois={locations} />
      </Map>
    </APIProvider>
  </LargeBox>
  )
}
