import { Component, OnInit, AfterViewInit, Input, NgZone } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-species-map',
  templateUrl: './species-map.component.html',
  styleUrls: ['./species-map.component.scss'],
  standalone: true,
})
export class SpeciesMapComponent implements OnInit, AfterViewInit {
  @Input() nativeRegions: string = '';
  @Input() speciesName: string = '';
  
  private map!: L.Map;
  private mapElementId: string;

  constructor(private ngZone: NgZone) {
    // Generate unique map element ID to avoid conflicts
    this.mapElementId = 'species-map-' + Math.random().toString(36).substr(2, 9);
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Initialize map after view is fully initialized
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.initMap();
        this.loadSpeciesDistribution();
        
        // Fix for map sizing issues
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    });
  }

  private initMap(): void {
    // Check if map element exists
    const mapElement = document.getElementById(this.mapElementId);
    if (!mapElement) {
      console.error('Species map element not found!');
      return;
    }
    
    // Define map bounds (roughly world boundaries with some padding)
    const southWest = L.latLng(-70, -200);
    const northEast = L.latLng(85, 200);
    const maxBounds = L.latLngBounds(southWest, northEast);
    
    // Initialize the map with restricted bounds and zoom
    this.map = L.map(this.mapElementId, {
      center: [0, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 5,
      maxBounds: maxBounds,
      maxBoundsViscosity: 1.0,
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

  private loadSpeciesDistribution(): void {
    if (!this.nativeRegions) {
      console.warn('No native regions provided for species map');
      return;
    }

    // Parse native regions (comma-separated codes like "HAI, FRA, BOL")
    const regionCodes = this.nativeRegions.split(',').map(code => code.trim());
    
    fetch('assets/data/map.geojson')
      .then((res) => res.json())
      .then((data) => {
        // Filter features that match the native regions
        const speciesFeatures = data.features.filter((feature: any) => {
          const locationCode = feature.properties.locationCode;
          return regionCodes.includes(locationCode);
        });

        if (speciesFeatures.length === 0) {
          console.warn('No matching regions found for codes:', regionCodes);
          return;
        }

        // Add base world map (light gray)
        const baseLayer = L.geoJSON(data, {
          style: {
            fillColor: '#f0f0f0',
            weight: 1,
            opacity: 0.5,
            color: '#ccc',
            fillOpacity: 0.3,
          }
        });
        baseLayer.addTo(this.map);

        // Add species-specific regions (green)
        const speciesLayer = L.geoJSON({ type: 'FeatureCollection', features: speciesFeatures } as any, {
          style: {
            fillColor: '#28a745',  // Green for native regions
            weight: 2,
            opacity: 1,
            color: '#155724',      // Dark green border
            fillOpacity: 0.7,
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(
              `<strong>${feature.properties.name}</strong><br/>Native region for: ${this.speciesName}`
            );
          },
        });
        
        speciesLayer.addTo(this.map);

        // Fit map to show all native regions
        if (speciesFeatures.length > 0) {
          const group = new L.FeatureGroup([speciesLayer]);
          this.map.fitBounds(group.getBounds().pad(0.1));
        }
      })
      .catch(error => {
        console.error('Error loading species distribution:', error);
      });
  }

  getMapElementId(): string {
    return this.mapElementId;
  }
}