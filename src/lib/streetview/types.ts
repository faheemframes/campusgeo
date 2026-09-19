export interface PanoramaOptions {
  panoId: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  initialHeading?: number;
  initialPitch?: number;
  initialZoom?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export interface StreetViewProvider {
  name: string;
  init(container: HTMLElement, options: PanoramaOptions): Promise<void>;
  loadPanorama(panoId: string): Promise<void>;
  setPov(heading: number, pitch: number): void;
  zoomIn?(): void;
  zoomOut?(): void;
  reset?(): void;
  destroy(): void;
}
