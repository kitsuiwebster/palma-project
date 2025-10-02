import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-palm-map',
  templateUrl: './palm-map.component.html',
  styleUrls: ['./palm-map.component.scss'],
  standalone: true,
})
export class PalmMapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    // Initialize map in ngOnInit but don't load content yet
  }

  ngAfterViewInit(): void {
    // Initialize map after view is fully initialized
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.initMap();
        this.loadGeoJson();
        
        // Fix for map sizing issues
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    });
  }

  private initMap(): void {
    // Check if map element exists
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map element not found!');
      return;
    }
    
    // Initialize the map
    this.map = L.map('map', {
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true
    });

    // Add tile layer with proper attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(this.map);
  }

  private loadGeoJson(): void {
    fetch('assets/data/map.geojson')
      .then((res) => res.json())
      .then((data) => {
        const geoLayer = L.geoJSON(data, {
          style: (feature: any) => ({
            fillColor: feature.properties.color ? feature.properties.color : this.getColor(feature.properties.speciesCount),
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7,
          }),
          onEachFeature: (feature, layer) => {
            const densityInfo = feature.properties.densityZone 
              ? `<br/>Zone: ${feature.properties.densityZone}`
              : '';
            layer.bindPopup(
              `<strong>${feature.properties.name}</strong><br/>Species: ${feature.properties.speciesCount}${densityInfo}`
            );
          },
        });
        
        geoLayer.addTo(this.map);
        
        // Fit bounds to the GeoJSON data
        try {
          const bounds = geoLayer.getBounds();
          this.map.fitBounds(bounds, { padding: [20, 20] });
        } catch (e) {
          console.warn('Could not fit to bounds:', e);
        }
      })
      .catch(error => {
        console.error('Error loading GeoJSON data:', error);
      });
  }

  private getColor(speciesCount: number): string {
    if (speciesCount > 100) return '#006400'; // dark green
    if (speciesCount > 50) return '#32CD32'; // lime green
    if (speciesCount > 10) return '#ADFF2F'; // light green
    return '#FFFFE0'; // pale yellow
  }
}