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
    // Create custom panes for layer ordering
    this.map.createPane('bottom').style.zIndex = '200';  // Indonesia + Peninsula Malaysia
    this.map.createPane('middle').style.zIndex = '300';  // Borneo base
    this.map.createPane('top').style.zIndex = '400';     // Brunei

    // Load bottom layer: main map (Indonesia + Peninsula Malaysia)
    this.loadMainMap()
      .then(() => this.loadBorneoLayer())
      .then(() => this.loadTopLayers())
      .catch(error => console.error('Error loading layered data:', error));
  }

  private loadMainMap(): Promise<void> {
    return fetch('assets/data/map.geojson')
      .then((res) => res.json())
      .then((data) => {
        // Filter out BOR (Borneo) and any Sarawak entries from main map to avoid conflicts
        const filteredFeatures = data.features.filter((feature: any) => {
          const code = feature.properties.locationCode;
          const name = feature.properties.name.toLowerCase();
          return code !== 'BOR' && !name.includes('sarawak');
        });

        const mainLayer = L.geoJSON({ type: 'FeatureCollection', features: filteredFeatures } as any, {
          pane: 'bottom',
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
            layer.bindPopup(
              `<strong>${feature.properties.name}</strong><br/>Species: ${feature.properties.speciesCount}${densityInfo}`
            );
          },
        });
        
        mainLayer.addTo(this.map);
      });
  }

  private loadBorneoLayer(): Promise<void> {
    // Load both Indonesian Borneo and Malaysian Sarawak as unified Borneo
    const borneoPromise = fetch('assets/data/geojsons/borneo.geojson').then(res => res.json());
    const sarawakPromise = fetch('assets/data/geojsons/sarawak.geojson').then(res => res.json());
    
    return Promise.all([borneoPromise, sarawakPromise])
      .then(([borneoData, sarawakData]) => {
        // Unified style function that forces the same color regardless of feature properties
        const forcedBorneoStyle = () => ({
          fillColor: '#660000',  // FORCED very dark red for unified Borneo (307 species)
          weight: 0,             // NO BORDER to avoid visual differences
          opacity: 0,            // NO BORDER OPACITY
          color: 'transparent',  // NO BORDER COLOR
          fillOpacity: 1.0,      // FULL OPACITY to avoid blending
        });

        // Load Indonesian Borneo with forced style
        const borneoLayer = L.geoJSON(borneoData, {
          pane: 'middle',
          style: forcedBorneoStyle,
          onEachFeature: (feature, layer) => {
            layer.bindPopup(
              `<strong>Borneo (Indonesian Part)</strong><br/>Species: 307<br/>Zone: Very High Density`
            );
          },
        });

        // Load Malaysian Sarawak with forced style
        const sarawakLayer = L.geoJSON(sarawakData, {
          pane: 'middle',
          style: forcedBorneoStyle,
          onEachFeature: (feature, layer) => {
            layer.bindPopup(
              `<strong>Borneo (Sarawak, Malaysia)</strong><br/>Species: 307<br/>Zone: Very High Density`
            );
          },
        });
        
        borneoLayer.addTo(this.map);
        sarawakLayer.addTo(this.map);
        
        console.log('✅ Loaded unified Borneo: Indonesian + Malaysian parts');
      });
  }

  private loadTopLayers(): Promise<void> {
    return fetch('assets/data/map.geojson')
      .then((res) => res.json())
      .then((data) => {
        // Only load Brunei (BKN) as top layer
        const bruneiFeature = data.features.find((feature: any) => 
          feature.properties.locationCode === 'BKN'
        );

        if (bruneiFeature) {
          const bruneiLayer = L.geoJSON(bruneiFeature, {
            pane: 'top',
            style: {
              fillColor: '#fdfa93',  // Yellow for Brunei (7 species)
              weight: 2,
              opacity: 1,
              color: '#333',
              fillOpacity: 0.8,
            },
            onEachFeature: (feature, layer) => {
              const densityInfo = feature.properties.densityZone 
                ? `<br/>Zone: ${feature.properties.densityZone}`
                : '';
              layer.bindPopup(
                `<strong>${feature.properties.name}</strong><br/>Species: ${feature.properties.speciesCount}${densityInfo}`
              );
            },
          });
          
          bruneiLayer.addTo(this.map);
        }

        // Fit bounds to all data
        try {
          const bounds = L.latLngBounds([[-10, 95], [10, 125]]);  // Southeast Asia bounds
          this.map.fitBounds(bounds, { padding: [20, 20] });
        } catch (e) {
          console.warn('Could not fit to bounds:', e);
        }
      });
  }

  private getColor(speciesCount: number): string {
    if (speciesCount > 250) return '#660000'; // very dark red (Borneo level)
    if (speciesCount > 150) return '#8B0000'; // dark red (high diversity)
    if (speciesCount > 100) return '#A52A2A'; // brown red (very high)
    if (speciesCount > 50) return '#CD5C5C'; // indian red (high)
    if (speciesCount > 10) return '#F4A460'; // sandy brown (medium)
    return '#FFFFE0'; // pale yellow (low)
  }
}