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
    
    // Define map bounds (roughly world boundaries with some padding)
    const southWest = L.latLng(-70, -200);
    const northEast = L.latLng(85, 200);
    const maxBounds = L.latLngBounds(southWest, northEast);
    
    // Initialize the map with restricted bounds and zoom
    this.map = L.map('map', {
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

  private loadGeoJson(): void {
    // Load multiple layers with priority order (higher pane = on top)
    this.loadLayeredGeoJson();
  }

  private loadLayeredGeoJson(): void {
    // Simple loading of main map without any special handling
    this.loadMainMap()
      .catch(error => console.error('Error loading map data:', error));
  }

  private loadMainMap(): Promise<void> {
    return fetch('assets/data/map.geojson')
      .then((res) => res.json())
      .then((data) => {
        const mainLayer = L.geoJSON(data, {
          style: (feature: any) => ({
            fillColor: feature.properties.color || this.getColor(feature.properties.speciesCount),
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7,
          }),
          onEachFeature: (feature, layer) => {
            const densityInfo = feature.properties.densityZone 
              ? `<br/>Zone: ${feature.properties.densityZone}`
              : '';
            
            // Enhanced popup with subdivision info for grouped countries
            let popupContent = `<strong>${feature.properties.name}</strong><br/>Species: ${feature.properties.speciesCount}${densityInfo}`;
            
            if (feature.properties.subdivisions && feature.properties.subdivisions.length > 1) {
              popupContent += '<br/><br/><strong>Subdivisions:</strong><br/>';
              feature.properties.subdivisions.forEach((sub: any) => {
                popupContent += `• ${sub.name}: ${sub.species} species<br/>`;
              });
            }
            
            layer.bindPopup(popupContent);
          },
        });
        
        mainLayer.addTo(this.map);
        
        // Set world view
        try {
          this.map.setView([0, 0], 2);
        } catch (e) {
          console.warn('Could not set view:', e);
        }
      });
  }

  private loadBorneoLayer(): Promise<void> {
    // Borneo is now handled as part of Indonesia (IDN) in the main map
    // No special Borneo layer needed anymore
    return Promise.resolve();
  }


  private getColor(speciesCount: number): string {
    // Progressive color scheme from species_colors.json
    if (speciesCount === 0) return '#f0f0f0'; // No species - Light gray
    if (speciesCount >= 301) return '#990000'; // Exceptional (300+ species) - Dark red
    if (speciesCount >= 201) return '#cc3300'; // Extremely high (201-300 species) - Red
    if (speciesCount >= 151) return '#e65500'; // Very high (151-200 species) - Orange-red
    if (speciesCount >= 101) return '#ff6600'; // High (101-150 species) - Dark orange
    if (speciesCount >= 61) return '#ff9933'; // Medium-high (61-100 species) - Orange
    if (speciesCount >= 31) return '#ffcc33'; // Medium (31-60 species) - Orange-yellow
    if (speciesCount >= 16) return '#ffe066'; // Medium-low (16-30 species) - Yellow
    if (speciesCount >= 6) return '#fff2aa'; // Low (6-15 species) - Light yellow
    if (speciesCount >= 1) return '#ffffcc'; // Very low (1-5 species) - Very light yellow
    return '#f0f0f0'; // Default fallback
  }
}