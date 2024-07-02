'use client';
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import type {Cluster, ClusterStats, Marker, Renderer} from '@googlemaps/markerclusterer';
import ImagePin from "@/components/imagePin/ImagePin";
import {
  useMap,
  AdvancedMarker
} from '@vis.gl/react-google-maps';
import './PoiMarkers.css';
export interface Poi { key: string, location: google.maps.LatLngLiteral, photoUrl:string }

class ImageLayout {
  items: any [];
  constructor() {
    this.items = [];
  }

  addImage(src:string) {
    const item = { src: src };
    this.items.push(item);
  }

  removeImage() {
    this.items.pop();
    this.layout();
  }
  layout() {
    const container = document.createElement('div');
    const layout = this.generateLayout(this.items.length);
    layout.forEach((area, index) => {
      const item = this.items[index];
      const div = document.createElement('div');
      div.className = 'image-item';
      div.style.gridColumn = `${area.x} / span ${area.width}`;
      div.style.gridRow = `${area.y} / span ${area.height}`;
      const img = document.createElement('img');
      img.src = item.src;
      div.appendChild(img);
      container.appendChild(div);
    });
    return container;
  }
  generateLayout(n: number) {
    const layouts = [
      [], // 0
      [{x: 1, y: 1, width: 4, height: 4}], // 1
      [{x: 1, y: 1, width: 2, height: 4}, {x: 3, y: 1, width: 2, height: 4}], // 2
      [{x: 1, y: 1, width: 4, height: 2}, {x: 1, y: 3, width: 2, height: 2}, {x: 3, y: 3, width: 2, height: 2}], // 3
      [{x: 1, y: 1, width: 2, height: 2}, {x: 3, y: 1, width: 2, height: 2}, {x: 1, y: 3, width: 2, height: 2}, {x: 3, y: 3, width: 2, height: 2}], // 4
      [{x: 1, y: 1, width: 2, height: 2}, {x: 3, y: 1, width: 2, height: 2}, {x: 1, y: 3, width: 2, height: 2}, {x: 3, y: 3, width: 1, height: 2}, {x: 4, y: 3, width: 1, height: 2}], // 5
      [{x: 1, y: 1, width: 2, height: 2}, {x: 3, y: 1, width: 2, height: 2}, {x: 1, y: 3, width: 2, height: 1}, {x: 3, y: 3, width: 2, height: 1}, {x: 1, y: 4, width: 2, height: 1}, {x: 3, y: 4, width: 2, height: 1}], // 6
      [{x: 1, y: 1, width: 2, height: 2}, {x: 3, y: 1, width: 2, height: 2}, {x: 1, y: 3, width: 1, height: 2}, {x: 2, y: 3, width: 1, height: 1}, {x: 2, y: 4, width: 1, height: 1}, {x: 3, y: 3, width: 1, height: 2}, {x: 4, y: 3, width: 1, height: 2}], // 7
      [{x: 1, y: 1, width: 2, height: 2}, {x: 3, y: 1, width: 2, height: 2}, {x: 1, y: 3, width: 1, height: 2}, {x: 2, y: 3, width: 1, height: 1}, {x: 2, y: 4, width: 1, height: 1}, {x: 3, y: 3, width: 1, height: 1}, {x: 4, y: 3, width: 1, height: 1}, {x: 3, y: 4, width: 2, height: 1}] // 8
    ];
    return layouts[n] || layouts[layouts.length - 1];
  }
}




export const PoiMarkers = (props: { pois: Poi[] }) => {
  class CustomRenderer implements Renderer {
    render(cluster: Cluster, stats: ClusterStats, map: google.maps.Map): google.maps.marker.AdvancedMarkerElement {
      const { position } = cluster; // Assuming cluster has a position property
      // const {} = stats;
      let ips = cluster.markers?.map(marker => {
        return keyMarkersRef.current.get(marker);
      })
       const divElement = document.createElement('div');
       const layout = new ImageLayout();
       locations.current.forEach(poi => {
        console.log(ips, poi.key, ips?.includes(poi.key));
        if(ips?.includes(poi.key)){
          layout.addImage(poi.photoUrl)
        } 
       })
       divElement.innerHTML = `
          <div id="image-container" class="image-container">
            ${layout.layout().innerHTML}
          </div>
       `;
       console.log(divElement);
       return new google.maps.marker.AdvancedMarkerElement({position, content: divElement});
    }
  }
  const map = useMap();
  const [markers, setMarkers] = useState<{[key: string]: Marker}>({});
  const keyMarkersRef = useRef(new Map());
  const locations = useRef<Poi[]>([]);
  const clusterer = useRef<MarkerClusterer | null>(null);
  const [circleCenter, setCircleCenter] = useState<google.maps.LatLng | null>(null)
  const handleClick = useCallback((ev: google.maps.MapMouseEvent) => {
    if(!map) return;
    if(!ev.latLng) return;
    console.log('marker clicked: ', ev.latLng.toString());
    map.panTo(ev.latLng);
    setCircleCenter(ev.latLng);
  }, [map]);
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({map,  renderer: new CustomRenderer()});
    }
  }, [map, props.pois]);

  // Update markers, if the markers array has changed
  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = (marker: Marker | null, key: string) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;
    setMarkers(prev => {
      if (marker) {
        return {...prev, [key]: marker};
      } else {
        const newMarkers = {...prev};
        delete newMarkers[key];
        return newMarkers;
      }
    });
    keyMarkersRef.current.set(marker, key);
    locations.current = props.pois;
  };
  return (
    <>
      {props.pois.map( (poi: Poi) => (
        <AdvancedMarker
          key={poi.key}
          position={poi.location}
          ref={marker => setMarkerRef(marker, poi.key)}
          clickable={true}
          onClick={handleClick}
          >
            <ImagePin src={poi.photoUrl}/>
        </AdvancedMarker>
      ))}
    </>
  );
};