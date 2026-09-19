import { PanoramaOptions, StreetViewProvider } from './types';

export class Fallback360Provider implements StreetViewProvider {
  name = 'Fallback360Photosphere';
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;

  private yaw = 0; // degrees
  private pitch = 0; // degrees
  private fov = 75; // field of view
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private currentPanoId = '';

  private offscreenPanoCanvas: HTMLCanvasElement | null = null;

  async init(container: HTMLElement, options: PanoramaOptions): Promise<void> {
    this.container = container;
    this.currentPanoId = options.panoId;
    this.yaw = options.initialHeading ?? 0;
    this.pitch = options.initialPitch ?? 0;

    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.renderProceduralPanorama(this.currentPanoId);
    this.bindEvents();
    this.startRenderLoop();

    options.onReady?.();
  }

  private renderProceduralPanorama(panoId: string): void {
    // Generate an equirectangular panorama texture (2048 x 1024)
    const off = document.createElement('canvas');
    off.width = 2048;
    off.height = 1024;
    const ctx = off.getContext('2d');
    if (!ctx) return;

    // Use hash of panoId to generate deterministic distinct campus scene
    let hash = 0;
    for (let i = 0; i < panoId.length; i++) {
      hash = (hash << 5) - hash + panoId.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, off.height * 0.55);
    const skyColors = [
      ['#1e3a8a', '#60a5fa', '#93c5fd'],
      ['#0f172a', '#3b82f6', '#bfdbfe'],
      ['#1e293b', '#6366f1', '#c7d2fe'],
      ['#172554', '#38bdf8', '#e0f2fe'],
    ];
    const sky = skyColors[seed % skyColors.length];
    skyGrad.addColorStop(0, sky[0]);
    skyGrad.addColorStop(0.6, sky[1]);
    skyGrad.addColorStop(1, '#fef08a'); // Warm haze near horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, off.width, off.height * 0.55);

    // Ground / asphalt / campus paving
    const groundGrad = ctx.createLinearGradient(0, off.height * 0.5, 0, off.height);
    groundGrad.addColorStop(0, '#334155'); // distant road
    groundGrad.addColorStop(0.3, '#1e293b');
    groundGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, off.height * 0.5, off.width, off.height * 0.5);

    // Road markings & campus walkway tiles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    for (let x = 0; x < off.width; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x, off.height * 0.55);
      ctx.lineTo(x + 40, off.height);
      ctx.stroke();
    }

    // Distant trees & greenery
    ctx.fillStyle = '#14532d';
    for (let x = 0; x < off.width; x += 30) {
      const treeH = 30 + ((seed + x) % 40);
      ctx.beginPath();
      ctx.arc(x, off.height * 0.52, treeH, Math.PI, 0);
      ctx.fill();
    }

    // Campus Architecture Buildings around 360 degrees
    const buildingCount = 7;
    const bWidth = off.width / buildingCount;
    for (let i = 0; i < buildingCount; i++) {
      const bx = i * bWidth + (seed % 40);
      const bHeight = 160 + ((seed * (i + 1)) % 220);
      const by = off.height * 0.52 - bHeight;
      const bColorChoices = ['#475569', '#64748b', '#334155', '#94a3b8', '#1e293b'];
      ctx.fillStyle = bColorChoices[(seed + i) % bColorChoices.length];
      ctx.fillRect(bx, by, bWidth * 0.7, bHeight);

      // Glass windows grid
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(147, 197, 253, 0.6)' : 'rgba(253, 224, 71, 0.4)';
      const winCols = 6;
      const winRows = 8;
      const wPadX = (bWidth * 0.7) / (winCols + 1);
      const wPadY = bHeight / (winRows + 1);
      for (let r = 1; r <= winRows; r++) {
        for (let c = 1; c <= winCols; c++) {
          ctx.fillRect(bx + c * wPadX - 5, by + r * wPadY - 4, wPadX * 0.6, wPadY * 0.5);
        }
      }

      // Pillars / facade details
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(bx, by, 10, bHeight);
      ctx.fillRect(bx + bWidth * 0.7 - 10, by, 10, bHeight);
    }

    // Street lights / Campus signage poles
    for (let x = 80; x < off.width; x += 300) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, off.height * 0.53);
      ctx.lineTo(x, off.height * 0.44);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x, off.height * 0.44, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    this.offscreenPanoCanvas = off;
  }

  private bindEvents(): void {
    if (!this.canvas) return;

    const onPointerDown = (clientX: number, clientY: number) => {
      this.isDragging = true;
      this.lastX = clientX;
      this.lastY = clientY;
      if (this.canvas) this.canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (clientX: number, clientY: number) => {
      if (!this.isDragging) return;
      const dx = clientX - this.lastX;
      const dy = clientY - this.lastY;
      this.lastX = clientX;
      this.lastY = clientY;

      // Rotate camera
      const sensitivity = 0.2;
      this.yaw = (this.yaw - dx * sensitivity) % 360;
      if (this.yaw < 0) this.yaw += 360;

      this.pitch = Math.max(-80, Math.min(80, this.pitch + dy * sensitivity));
    };

    const onPointerUp = () => {
      this.isDragging = false;
      if (this.canvas) this.canvas.style.cursor = 'grab';
    };

    this.canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 1) {
          onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    this.canvas.addEventListener('touchend', onPointerUp);

    // Zoom via wheel
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.fov = Math.max(35, Math.min(100, this.fov + e.deltaY * 0.05));
      },
      { passive: false }
    );
  }

  private startRenderLoop(): void {
    const render = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  private draw(): void {
    if (!this.canvas || !this.ctx || !this.offscreenPanoCanvas) return;

    // Handle high DPI
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, cw, ch);

    // Render cylindrical projection of equirectangular panorama
    const pano = this.offscreenPanoCanvas;
    const panoW = pano.width;
    const panoH = pano.height;

    // Normalize yaw: 0 to 1
    const normYaw = (this.yaw % 360) / 360;
    const fovFactor = this.fov / 90;

    // Source slice width based on FOV
    const srcW = panoW * fovFactor * (cw / ch);
    const srcH = panoH * fovFactor;

    const srcX = normYaw * panoW - srcW / 2;
    const normPitch = (this.pitch + 90) / 180;
    const srcY = (1 - normPitch) * panoH - srcH / 2;

    // Draw panoramic texture with seamless horizontal wrapping
    const drawWrapped = (sx: number, sy: number, sw: number, sh: number) => {
      // If sx is negative or extends past panoW, wrap into 2 drawImage calls
      let left = sx;
      while (left < 0) left += panoW;
      left = left % panoW;

      if (left + sw <= panoW) {
        ctx.drawImage(pano, left, Math.max(0, Math.min(panoH - sh, sy)), sw, sh, 0, 0, cw, ch);
      } else {
        const part1W = panoW - left;
        const part2W = sw - part1W;
        const screenPart1W = (part1W / sw) * cw;
        const screenPart2W = cw - screenPart1W;

        ctx.drawImage(
          pano,
          left,
          Math.max(0, Math.min(panoH - sh, sy)),
          part1W,
          sh,
          0,
          0,
          screenPart1W,
          ch
        );
        ctx.drawImage(
          pano,
          0,
          Math.max(0, Math.min(panoH - sh, sy)),
          part2W,
          sh,
          screenPart1W,
          0,
          screenPart2W,
          ch
        );
      }
    };

    drawWrapped(srcX, srcY, srcW, srcH);

    // Subtle compass indicator at top right of viewport
    this.drawCompassOverlay(ctx, cw);
  }

  private drawCompassOverlay(ctx: CanvasRenderingContext2D, cw: number): void {
    const compassX = cw - 40;
    const compassY = 40;
    const radius = 22;

    ctx.save();
    ctx.translate(compassX, compassY);
    ctx.rotate(((-this.yaw + 360) * Math.PI) / 180);

    // Background circle
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // North needle (red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -radius + 4);
    ctx.lineTo(5, 0);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();

    // South needle (white)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(0, radius - 4);
    ctx.lineTo(5, 0);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();

    // "N" label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -radius + 15);

    ctx.restore();
  }

  async loadPanorama(panoId: string): Promise<void> {
    this.currentPanoId = panoId;
    this.renderProceduralPanorama(panoId);
  }

  setPov(heading: number, pitch: number): void {
    this.yaw = heading;
    this.pitch = pitch;
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.canvas && this.container) {
      this.container.innerHTML = '';
      this.canvas = null;
    }
  }
}
