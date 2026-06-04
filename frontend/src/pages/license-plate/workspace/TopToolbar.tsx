import React, { useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { Tooltip, message } from 'antd';
import {
  ZoomInOutlined, ZoomOutOutlined, ScissorOutlined,
  UndoOutlined, RedoOutlined, ReloadOutlined,
  SunOutlined, BgColorsOutlined, AimOutlined,
  CompressOutlined, FullscreenOutlined, CameraOutlined, DownloadOutlined
} from '@ant-design/icons';
import { filesApi } from '../../../api/files';

const ToolButton: React.FC<{
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
  onClick?: () => void;
  highlight?: string;
}> = ({ icon, tooltip, active, onClick, highlight }) => (
  <Tooltip title={tooltip} placement="bottom">
    <button
      onClick={onClick}
      style={{
        background: active ? (highlight || '#1890ff22') : 'transparent',
        border: active ? `1px solid ${highlight || '#1890ff'}` : '1px solid transparent',
        borderRadius: 6,
        color: active ? (highlight || '#1890ff') : '#aaa',
        cursor: 'pointer',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as any).style.background = '#303030'; (e.currentTarget as any).style.color = '#fff'; }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as any).style.background = 'transparent'; (e.currentTarget as any).style.color = '#aaa'; } }}
    >
      {icon}
    </button>
  </Tooltip>
);

const TopToolbar: React.FC = () => {
  const { activeFile, activeTool, setActiveTool, zoom, setZoom, resetAdjustments, addFile } = useWorkspace();
  const [extracting, setExtracting] = useState(false);

  const handleExtractFrame = async () => {
    const videoEl = document.getElementById('workspace-video') as HTMLVideoElement;
    if (!videoEl || !activeFile) return;
    setExtracting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 1280;
      canvas.height = videoEl.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const t = Math.floor(videoEl.currentTime);
            const file = new File([blob], `frame_${t}s.png`, { type: 'image/png' });
            try {
              const res = await filesApi.upload(file, '/frames');
              const newId = res.data.data.id;
              addFile({ id: `frame_${Date.now()}`, name: `Frame ${t}s`, type: 'frame', url: URL.createObjectURL(blob), thumbnail: URL.createObjectURL(blob), fileId: newId, timestamp: `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}` });
            } catch {
              // offline fallback
              addFile({ id: `frame_${Date.now()}`, name: `Frame ${Math.floor(videoEl.currentTime)}s`, type: 'frame', url: URL.createObjectURL(blob), thumbnail: URL.createObjectURL(blob), fileId: Date.now(), timestamp: `00:${String(Math.floor(videoEl.currentTime)).padStart(2,'0')}` });
            }
            message.success('Trích xuất thành công!');
          }
        }, 'image/png');
      }
    } catch { message.error('Lỗi khi trích xuất'); }
    finally { setExtracting(false); }
  };

  return (
    <div style={{
      height: 48, background: '#1a1a1a',
      borderBottom: '1px solid #2a2a2a',
      display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 4,
    }}>
      {/* Select tool */}
      <ToolButton icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1l6 14 2-5 5-2L1 1z"/></svg>} tooltip="Chọn (V)" active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
      <ToolButton icon={<AimOutlined />} tooltip="Chỉ điểm biển số (P)" active={activeTool === 'point'} onClick={() => setActiveTool('point')} highlight="#f5a623" />
      <ToolButton icon={<ScissorOutlined />} tooltip="Cắt ảnh (C)" active={activeTool === 'crop'} onClick={() => setActiveTool('crop')} highlight="#52c41a" />

      <div style={{ width: 1, height: 24, background: '#333', margin: '0 6px' }} />

      <ToolButton icon={<SunOutlined />} tooltip="Điều chỉnh ánh sáng (L)" active={activeTool === 'light'} onClick={() => setActiveTool('light')} highlight="#fadb14" />
      <ToolButton icon={<BgColorsOutlined />} tooltip="Màu sắc / Bão hoà (S)" active={activeTool === 'color'} onClick={() => setActiveTool('color')} highlight="#eb2f96" />
      <ToolButton icon={<CompressOutlined />} tooltip="Khử nhiễu (N)" active={activeTool === 'noise'} onClick={() => setActiveTool('noise')} highlight="#722ed1" />

      <div style={{ width: 1, height: 24, background: '#333', margin: '0 6px' }} />

      {/* Zoom */}
      <ToolButton icon={<ZoomOutOutlined />} tooltip="Thu nhỏ (-)" onClick={() => setZoom(Math.max(10, zoom - 10))} />
      <div style={{ background: '#262626', borderRadius: 4, padding: '2px 8px', color: '#aaa', fontSize: 12, minWidth: 44, textAlign: 'center', userSelect: 'none' }}>
        {zoom}%
      </div>
      <ToolButton icon={<ZoomInOutlined />} tooltip="Phóng to (+)" onClick={() => setZoom(Math.min(400, zoom + 10))} />
      <ToolButton icon={<FullscreenOutlined />} tooltip="Khớp khung (F)" onClick={() => setZoom(100)} />

      <div style={{ width: 1, height: 24, background: '#333', margin: '0 6px' }} />

      <ToolButton icon={<UndoOutlined />} tooltip="Hoàn tác (Ctrl+Z)" />
      <ToolButton icon={<RedoOutlined />} tooltip="Làm lại (Ctrl+Y)" />
      <ToolButton icon={<ReloadOutlined />} tooltip="Khôi phục gốc" onClick={resetAdjustments} />

      <div style={{ flex: 1 }} />

      {/* Right actions */}
      {activeFile?.type === 'video' && (
        <button
          onClick={handleExtractFrame}
          disabled={extracting}
          style={{
            background: '#1890ff', border: 'none', borderRadius: 6, color: '#fff',
            cursor: 'pointer', padding: '0 14px', height: 32, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
            opacity: extracting ? 0.6 : 1
          }}
        >
          <CameraOutlined /> {extracting ? 'Đang trích xuất...' : 'Trích xuất khung hình'}
        </button>
      )}

      {activeFile && activeFile.type !== 'video' && (
        <button style={{ background: '#262626', border: '1px solid #404040', borderRadius: 6, color: '#aaa', cursor: 'pointer', padding: '0 14px', height: 32, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <DownloadOutlined /> Xuất ảnh
        </button>
      )}
    </div>
  );
};

export default TopToolbar;
