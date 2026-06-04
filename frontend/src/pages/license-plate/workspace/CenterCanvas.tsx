import React, { useRef, useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { message } from 'antd';
import { ExpandOutlined } from '@ant-design/icons';

const CenterCanvas: React.FC = () => {
  const { activeFile, brightness, contrast, sharpness, noiseReduction, saturation, zoom, activeTool } = useWorkspace();
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const imgRef = useRef<HTMLDivElement>(null);

  const filterStyle = [
    `brightness(${1 + brightness / 100})`,
    `contrast(${1 + contrast / 100})`,
    `saturate(${1 + saturation / 100})`,
    noiseReduction > 0 ? `blur(${noiseReduction * 0.04}px)` : '',
    sharpness > 0 ? `contrast(${1 + sharpness * 0.003})` : '',
  ].filter(Boolean).join(' ');

  const getCursor = () => {
    if (activeTool === 'crop') return 'crosshair';
    if (activeTool === 'point') return 'cell';
    return 'default';
  };

  const handleImgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'point') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints(prev => [...prev, { x, y }]);
    message.success(`Đã chỉ điểm: (${Math.round(x)}, ${Math.round(y)})`);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'crop') return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCropRect(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'crop' || !cropStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setCropRect({ x: Math.min(cropStart.x, cx), y: Math.min(cropStart.y, cy), w: Math.abs(cx - cropStart.x), h: Math.abs(cy - cropStart.y) });
  };

  const handleMouseUp = () => {
    if (activeTool === 'crop' && cropRect && cropRect.w > 10 && cropRect.h > 10) {
      message.info(`Đã chọn vùng cắt: ${Math.round(cropRect.w)}×${Math.round(cropRect.h)}px`);
    }
    setCropStart(null);
  };

  if (!activeFile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', color: '#333', gap: 12 }}>
        <ExpandOutlined style={{ fontSize: 48 }} />
        <div style={{ fontSize: 14 }}>Chọn một file từ bộ sưu tập bên trái</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0d0d', overflow: 'hidden', position: 'relative' }}>
      {/* Tab bar */}
      <div style={{ height: 34, background: '#161616', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 2 }}>
        <div style={{
          padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center',
          background: '#0d0d0d', borderTop: '2px solid #1890ff',
          color: '#fff', fontSize: 12, gap: 6, borderRadius: '4px 4px 0 0'
        }}>
          {activeFile.type === 'video'
            ? <span style={{ color: '#1890ff', fontSize: 10 }}>▶</span>
            : <span style={{ color: '#52c41a', fontSize: 10 }}>◆</span>
          }
          {activeFile.name}
        </div>
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', padding: 32 }}>
        <div
          ref={imgRef}
          style={{ position: 'relative', cursor: getCursor(), transformOrigin: 'center', transform: `scale(${zoom / 100})` }}
          onClick={handleImgClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {activeFile.type === 'video' ? (
            <video
              id="workspace-video"
              src={activeFile.url}
              controls
              style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', outline: 'none', borderRadius: 4, display: 'block', filter: filterStyle }}
            />
          ) : (
            <img
              src={activeFile.url}
              alt="canvas"
              style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain', borderRadius: 4, display: 'block', filter: filterStyle, transition: 'filter 0.1s ease-out', userSelect: 'none', pointerEvents: 'none' }}
            />
          )}

          {/* Crop overlay */}
          {activeTool === 'crop' && cropRect && (
            <div style={{ position: 'absolute', top: cropRect.y, left: cropRect.x, width: cropRect.w, height: cropRect.h, border: '2px dashed #52c41a', background: 'rgba(82,196,26,0.08)', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: -1, left: -1, width: 8, height: 8, background: '#52c41a', borderRadius: 1 }} />
              <div style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, background: '#52c41a', borderRadius: 1 }} />
              <div style={{ position: 'absolute', bottom: -1, left: -1, width: 8, height: 8, background: '#52c41a', borderRadius: 1 }} />
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, background: '#52c41a', borderRadius: 1 }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#52c41a', fontSize: 11, whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4 }}>
                {Math.round(cropRect.w)} × {Math.round(cropRect.h)}
              </div>
            </div>
          )}

          {/* Point markers */}
          {activeTool === 'point' && points.map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: p.x - 6, top: p.y - 6, width: 12, height: 12, borderRadius: '50%', background: '#f5a623', border: '2px solid #fff', pointerEvents: 'none', boxShadow: '0 0 8px rgba(245,166,35,0.8)' }}>
              <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', color: '#f5a623', fontSize: 10, whiteSpace: 'nowrap', fontWeight: 700 }}>P{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom status bar */}
      <div style={{ height: 24, background: '#111', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 16, fontSize: 11, color: '#555' }}>
        <span>{activeFile.name}</span>
        {activeFile.size && <span>|  {activeFile.size}</span>}
        {activeFile.type === 'video' && activeFile.duration && <span>|  {activeFile.duration}</span>}
        <span style={{ marginLeft: 'auto' }}>
          {activeTool === 'crop' && <span style={{ color: '#52c41a' }}>● Chế độ cắt — kéo để chọn vùng</span>}
          {activeTool === 'point' && <span style={{ color: '#f5a623' }}>● Chế độ chỉ điểm — click để đặt điểm ({points.length} điểm)</span>}
          {activeTool === 'select' && <span>Zoom: {zoom}%</span>}
        </span>
      </div>
    </div>
  );
};

export default CenterCanvas;
