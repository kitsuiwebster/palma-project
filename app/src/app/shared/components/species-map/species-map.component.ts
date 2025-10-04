import { Component, OnInit, AfterViewInit, Input, NgZone } from '@angular/core';
import * as L from 'leaflet';
import { RegionCodesService } from '../../../core/services/region-codes.service';

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

  constructor(
    private ngZone: NgZone,
    private regionCodesService: RegionCodesService
  ) {
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
      minZoom: 1.5,          // Prevent excessive zoom out
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

  private async loadSpeciesDistribution(): Promise<void> {
    if (!this.nativeRegions) {
      console.warn('No native regions provided for species map');
      return;
    }

    // Parse native regions (comma-separated codes like "HAI, FRA, BOL")
    const regionCodes = this.nativeRegions.split(',').map(code => code.trim());
    
    try {
      const response = await fetch('assets/data/map.geojson');
      const data = await response.json();
      
      // Separate subdivision codes from regular codes
      const regularCodes: string[] = [];
      const subdivisionCodes: string[] = [];
      const parentCountriesForSubdivisions = new Set<string>();
      
      for (const code of regionCodes) {
        if (this.regionCodesService.isSubdivision(code)) {
          subdivisionCodes.push(code);
          // Add parent countries to render on map
          const parents = this.regionCodesService.getParentCountries(code);
          parents.forEach((parent: string) => parentCountriesForSubdivisions.add(parent));
        } else {
          regularCodes.push(code);
        }
      }
      
      // Combine regular codes with parent countries from subdivisions
      const codesToRender = [...regularCodes, ...Array.from(parentCountriesForSubdivisions)];
      
      // Filter features that match the codes to render
      const speciesFeatures = data.features.filter((feature: any) => {
        const locationCode = feature.properties.locationCode;
        return codesToRender.includes(locationCode);
      });

      if (speciesFeatures.length === 0) {
        console.warn('No matching regions found for codes:', regionCodes);
        this.showNoDataMessage();
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

      // Add species-specific regions (modern green style)
      const speciesLayer = L.geoJSON({ type: 'FeatureCollection', features: speciesFeatures } as any, {
        style: {
          fillColor: '#22c55e',  // Modern bright green
          weight: 1.5,           // Thinner, cleaner borders  
          opacity: 0.8,          // Slightly transparent border
          color: '#16a34a',      // Subtle green border
          fillOpacity: 0.6,      // More transparent fill for elegance
          dashArray: '',         // Solid line (no dashes)
          lineCap: 'round',      // Rounded line caps
          lineJoin: 'round'      // Rounded line joins
        },
        onEachFeature: (feature, layer) => {
          this.addPopupToFeature(feature, layer, regionCodes);
        },
      });
      
      speciesLayer.addTo(this.map);

      // Fit map to show all native regions
      if (speciesFeatures.length > 0) {
        const group = new L.FeatureGroup([speciesLayer]);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }
      
    } catch (error) {
      console.error('Error loading species distribution:', error);
      this.showErrorMessage();
    }
  }
  
  private async addPopupToFeature(feature: any, layer: L.Layer, originalCodes: string[]): Promise<void> {
    const locationCode = feature.properties.locationCode;
    const countryName = feature.properties.name;
    
    // Check if this country is representing any subdivisions
    const representedSubdivisions = originalCodes.filter(code => {
      const parents = this.regionCodesService.getParentCountries(code);
      return parents.includes(locationCode);
    });
    
    let popupContent = `<strong>${countryName}</strong><br/>`;
    
    if (representedSubdivisions.length > 0) {
      // Show subdivision details
      const subdivisionTexts: string[] = [];
      for (const subCode of representedSubdivisions) {
        const subName = this.regionCodesService.getSubdivisionName(subCode);
        subdivisionTexts.push(subName);
      }
      popupContent += `Native to: ${subdivisionTexts.join(', ')}<br/>`;
    } else {
      popupContent += `Native region<br/>`;
    }
    
    // Remove species name from popup
    
    layer.bindPopup(popupContent);
  }
  
  private showNoDataMessage(): void {
    // Add a simple text overlay when no geographic data is available
    const noDataControl = new L.Control({ position: 'topright' });
    noDataControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'species-map-no-data');
      div.style.background = 'rgba(255, 255, 255, 0.9)';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.border = '1px solid #ccc';
      div.innerHTML = '<strong>⚠️ Geographic data unavailable</strong><br/>Location details may be limited';
      return div;
    };
    noDataControl.addTo(this.map);
  }
  
  private showErrorMessage(): void {
    // Add error message overlay
    const errorControl = new L.Control({ position: 'topright' });
    errorControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'species-map-error');
      div.style.background = 'rgba(255, 255, 255, 0.9)';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.border = '1px solid #dc3545';
      div.innerHTML = '<strong>❌ Map data error</strong><br/>Unable to load geographic information';
      return div;
    };
    errorControl.addTo(this.map);
  }

  getMapElementId(): string {
    return this.mapElementId;
  }
}