import { PanoramaOptions, StreetViewProvider } from './types';

declare global {
  interface Window {
    google?: {
      maps: {
        StreetViewPanorama: new (
          container: HTMLElement,
          opts?: Record<string, unknown>
        ) => unknown;
        StreetViewStatus: {
          OK: string;
        };
      };
    };
    initGoogleMapsStreetView?: () => void;
  }
}

let googleScriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not found'));
  if (window.google?.maps?.StreetViewPanorama) return Promise.resolve();
  if (googleScriptLoadingPromise) return googleScriptLoadingPromise;

  googleScriptLoadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-maps-streetview-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-streetview-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return googleScriptLoadingPromise;
}

export class GoogleStreetViewProvider implements StreetViewProvider {
  name = 'GoogleStreetView';
  private panorama: any = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async init(container: HTMLElement, options: PanoramaOptions): Promise<void> {
    try {
      await loadGoogleMapsScript(this.apiKey);
      if (!window.google?.maps?.StreetViewPanorama) {
        throw new Error('Google Maps StreetViewPanorama not available');
      }

      this.panorama = new window.google.maps.StreetViewPanorama(container, {
        pano: options.panoId,
        addressControl: false,
        showRoadLabels: false,
        motionTracking: false,
        motionTrackingControl: false,
        fullscreenControl: false,
        linksControl: true,
        panControl: true,
        enableCloseButton: false,
        zoomControl: true,
        clickToGo: true,
        pov: {
          heading: options.initialHeading ?? 0,
          pitch: options.initialPitch ?? 0,
        },
        zoom: options.initialZoom ?? 1,
      });

      options.onReady?.();
    } catch (err: any) {
      options.onError?.(err);
      throw err;
    }
  }

  async loadPanorama(panoId: string): Promise<void> {
    if (this.panorama && typeof this.panorama.setPano === 'function') {
      this.panorama.setPano(panoId);
    }
  }

  setPov(heading: number, pitch: number): void {
    if (this.panorama && typeof this.panorama.setPov === 'function') {
      this.panorama.setPov({ heading, pitch });
    }
  }

  destroy(): void {
    if (this.panorama) {
      this.panorama = null;
    }
  }
}
