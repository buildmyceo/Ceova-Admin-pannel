import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Check, 
  Grid, 
  Maximize2,
  Image as ImageIcon,
  Move
} from 'lucide-react';

export interface ImageCropModalProps {
  imageSrc: string;
  cropType: 'profile' | 'cover';
  title?: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  cropType,
  title,
  onConfirm,
  onCancel
}) => {
  const isCover = cropType === 'cover';
  // Cover photo requirement: 16:9, 1280 x 720 px
  const targetWidth = isCover ? 1280 : 500;
  const targetHeight = isCover ? 720 : 500;
  const aspectRatio = targetWidth / targetHeight; // 16/9 = 1.77778 for cover, 1.0 for profile

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const touchDistanceRef = useRef<number | null>(null);

  // Compute responsive viewport display dimensions
  const [viewportSize, setViewportSize] = useState({ width: 480, height: isCover ? 270 : 480 });

  const updateViewportSize = useCallback(() => {
    if (!containerRef.current) return;
    const maxW = Math.min(window.innerWidth - 48, isCover ? 560 : 380);
    const w = Math.max(280, maxW);
    const h = Math.round(w / aspectRatio);
    setViewportSize({ width: w, height: h });
  }, [aspectRatio, isCover]);

  useEffect(() => {
    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, [updateViewportSize]);

  // Load image once per imageSrc (never re-load on scale/offset/draw changes)
  useEffect(() => {
    let active = true;
    const img = new Image();
    if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (!active) return;
      imageRef.current = img;
      setLoadedImage(img);
      setScale(1);
      setRotation(0);
      setOffsetX(0);
      setOffsetY(0);
    };
    img.onerror = (err) => {
      if (!active) return;
      console.warn('ImageCropModal: Failed to decode image for crop canvas, using direct image:', err);
      onConfirm(imageSrc);
    };
    img.src = imageSrc;
    return () => {
      active = false;
    };
  }, [imageSrc, onConfirm]);

  // Draw image on canvas whenever transform or image changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current || loadedImage;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: vw, height: vh } = viewportSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, vw, vh);

    // Save state
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Move to viewport center
    ctx.translate(vw / 2 + offsetX, vh / 2 + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Determine dimensions to cover viewport at scale 1
    const isRotated90or270 = rotation % 180 !== 0;
    const effImgW = isRotated90or270 ? (img.naturalHeight || img.height || 1) : (img.naturalWidth || img.width || 1);
    const effImgH = isRotated90or270 ? (img.naturalWidth || img.width || 1) : (img.naturalHeight || img.height || 1);

    const baseScale = Math.max(vw / effImgW, vh / effImgH);
    const drawW = (img.naturalWidth || img.width) * baseScale;
    const drawH = (img.naturalHeight || img.height) * baseScale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();
  }, [loadedImage, viewportSize, offsetX, offsetY, rotation, scale]);

  // Redraw when viewport or transform parameters change
  useEffect(() => {
    draw();
  }, [draw]);

  // Pointer drag handlers (desktop mouse + mobile touch) with pointer capture
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Pinch-to-zoom for touch screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = newDist / touchDistanceRef.current;
      touchDistanceRef.current = newDist;
      setScale(prev => Math.min(4, Math.max(0.5, Number((prev * factor).toFixed(2)))));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchDistanceRef.current = null;
    }
  };

  // Wheel zoom via native non-passive listener
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
      setScale(prev => Math.min(4, Math.max(0.5, Number((prev + zoomDelta).toFixed(2)))));
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, []);

  const handleZoomIn = () => {
    setScale(prev => Math.min(4, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, Number((prev - 0.15).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleConfirm = () => {
    const img = imageRef.current || loadedImage;
    if (!img) {
      onConfirm(imageSrc);
      return;
    }

    setIsProcessing(true);

    try {
      // Create high-res export canvas at exact target resolution
      // (1280x720 for cover, 500x500 for profile)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetWidth;
      exportCanvas.height = targetHeight;

      const ctx = exportCanvas.getContext('2d');
      if (!ctx) {
        onConfirm(imageSrc);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background fill
      if (isCover) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Scale factor from preview viewport to export canvas
      const exportRatio = targetWidth / viewportSize.width;

      ctx.translate(
        targetWidth / 2 + offsetX * exportRatio,
        targetHeight / 2 + offsetY * exportRatio
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      const isRotated90or270 = rotation % 180 !== 0;
      const effImgW = isRotated90or270 ? (img.naturalHeight || img.height || 1) : (img.naturalWidth || img.width || 1);
      const effImgH = isRotated90or270 ? (img.naturalWidth || img.width || 1) : (img.naturalHeight || img.height || 1);

      const baseScale = Math.max(viewportSize.width / effImgW, viewportSize.height / effImgH);
      const drawW = (img.naturalWidth || img.width) * baseScale * exportRatio;
      const drawH = (img.naturalHeight || img.height) * baseScale * exportRatio;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      // Export optimized high fidelity JPEG
      const outputDataUrl = exportCanvas.toDataURL('image/jpeg', 0.85);
      onConfirm(outputDataUrl);
    } catch (err) {
      console.warn('High-res canvas export failed, attempting preview canvas fallback:', err);
      try {
        if (canvasRef.current) {
          const previewData = canvasRef.current.toDataURL('image/jpeg', 0.85);
          onConfirm(previewData);
          return;
        }
      } catch (cErr) {
        console.warn('Canvas export failed completely:', cErr);
      }
      onConfirm(imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  const defaultTitle = isCover ? 'Crop Cover Photo' : 'Crop Profile Photo';

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000000,
        padding: 16,
        overflowY: 'auto'
      }}
    >
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: isCover ? 620 : 460,
          background: 'rgba(18, 18, 22, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ImageIcon size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                {title || defaultTitle}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: isCover ? '#38bdf8' : '#a78bfa',
                background: isCover ? 'rgba(56, 189, 248, 0.12)' : 'rgba(167, 139, 250, 0.12)',
                padding: '2px 8px',
                borderRadius: 4,
                border: isCover ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(167, 139, 250, 0.25)'
              }}>
                {isCover ? '16:9 • 1280 × 720 px' : '1:1 • 500 × 500 px'}
              </span>
              <span style={{ fontSize: 11.5, color: '#71717a' }}>
                Drag to reposition &amp; frame
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              padding: 6,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop Viewport */}
        <div style={{
          padding: '20px 20px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#09090b'
        }}>
          <div 
            ref={viewportRef}
            style={{
              width: viewportSize.width,
              height: viewportSize.height,
              position: 'relative',
              borderRadius: isCover ? 10 : '50%',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.15), 0 12px 30px rgba(0, 0, 0, 0.7)',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas 
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block'
              }}
            />

            {/* Rule of thirds grid overlay */}
            {showGrid && (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gridTemplateRows: '1fr 1fr 1fr',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: isCover ? 10 : '50%'
                }}
              >
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.3)', borderBottom: '1px dashed rgba(255, 255, 255, 0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.3)', borderBottom: '1px dashed rgba(255, 255, 255, 0.3)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.3)', borderBottom: '1px dashed rgba(255, 255, 255, 0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.3)', borderBottom: '1px dashed rgba(255, 255, 255, 0.3)' }} />
                <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.3)' }} />
                <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.3)' }} />
                <div />
              </div>
            )}

            {/* Circular frame guide for profile */}
            {!isCover && (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(96, 165, 250, 0.7)',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#71717a',
            fontSize: 11.5,
            marginTop: 10
          }}>
            <Move size={12} />
            <span>Click &amp; drag or swipe to reposition • Scroll wheel to zoom</span>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              title="Zoom out"
              onClick={handleZoomOut}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e4e4e7',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <ZoomOut size={15} />
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input 
                type="range"
                min="0.5"
                max="4"
                step="0.05"
                value={scale}
                onChange={e => setScale(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: '#3b82f6',
                  cursor: 'pointer'
                }}
              />
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#e4e4e7',
                minWidth: 46,
                textAlign: 'right'
              }}>
                {Math.round(scale * 100)}%
              </span>
            </div>

            <button
              type="button"
              title="Zoom in"
              onClick={handleZoomIn}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e4e4e7',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Quick Buttons & Action Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}>
            {/* Left buttons: Rotate, Grid, Reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90 degrees"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e4e4e7',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <RotateCw size={13} />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGrid(prev => !prev)}
                title="Toggle guide grid"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: showGrid ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  border: showGrid ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: showGrid ? '#60a5fa' : '#a1a1aa',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <Grid size={13} />
                <span>Grid</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset to center and normal scale"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#a1a1aa',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            {/* Right buttons: Cancel, Use Full Photo, & Apply */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e4e4e7',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => onConfirm(imageSrc)}
                disabled={isProcessing}
                title="Use original full photo without cropping"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                Use Full Photo
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                <Check size={14} />
                <span>{isProcessing ? 'Processing...' : 'Crop & Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
