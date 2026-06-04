import React, { useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import type { FileNode } from './WorkspaceContext';
import { Tooltip, message } from 'antd';
import {
  VideoCameraOutlined, PictureOutlined, AppstoreOutlined,
  CloseOutlined, EyeOutlined, PlusOutlined, FolderOpenOutlined
} from '@ant-design/icons';
import { filesApi } from '../../../api/files';

const FileCard: React.FC<{ file: FileNode; active: boolean; onClick: () => void; onRemove: () => void }> = ({ file, active, onClick, onRemove }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
        border: active ? '2px solid #1890ff' : '2px solid transparent',
        transition: 'all 0.15s',
        background: '#111',
        flexShrink: 0,
        width: '100%',
      }}
    >
      <div style={{ aspectRatio: '16/9', background: '#111', overflow: 'hidden' }}>
        {file.thumbnail ? (
          <img src={file.thumbnail} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
            {file.type === 'video' ? <VideoCameraOutlined style={{ fontSize: 24 }} /> : <PictureOutlined style={{ fontSize: 24 }} />}
          </div>
        )}
        {hover && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EyeOutlined style={{ color: '#fff', fontSize: 20 }} />
          </div>
        )}
      </div>
      {file.type === 'video' && file.duration && (
        <div style={{ position: 'absolute', bottom: 24, right: 4, background: 'rgba(0,0,0,0.75)', borderRadius: 3, padding: '1px 5px', color: '#fff', fontSize: 10 }}>
          {file.duration}
        </div>
      )}
      {file.timestamp && (
        <div style={{ position: 'absolute', bottom: 24, right: 4, background: 'rgba(0,0,0,0.75)', borderRadius: 3, padding: '1px 5px', color: '#aef', fontSize: 10 }}>
          {file.timestamp}
        </div>
      )}
      {hover && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
        >
          <CloseOutlined />
        </button>
      )}
      <div style={{ padding: '4px 6px', background: '#181818' }}>
        <div style={{ color: active ? '#1890ff' : '#ddd', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
        {file.size && <div style={{ color: '#555', fontSize: 10 }}>{file.size}</div>}
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string; count: number; color: string }> = ({ icon, label, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px 6px', color: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
    <span style={{ color }}>{icon}</span>
    {label}
    <div style={{ marginLeft: 'auto', background: '#2a2a2a', borderRadius: 10, padding: '0px 6px', color: '#666', fontSize: 10 }}>{count}</div>
  </div>
);

const LeftSidebar: React.FC = () => {
  const { files, activeFile, setActiveFile, addFile, removeFile } = useWorkspace();
  const [uploading, setUploading] = useState(false);

  const videos = files.filter(f => f.type === 'video');
  const images = files.filter(f => f.type === 'image');
  const frames = files.filter(f => f.type === 'frame');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    try {
      const res = await filesApi.upload(file, '/');
      const serverFile = res.data.data;
      addFile({ id: `upload_${Date.now()}`, name: file.name, type: isVideo ? 'video' : 'image', url: localUrl, thumbnail: isVideo ? undefined : localUrl, fileId: serverFile.id, size: `${(file.size / 1024).toFixed(0)} KB` });
    } catch {
      addFile({ id: `upload_${Date.now()}`, name: file.name, type: isVideo ? 'video' : 'image', url: localUrl, thumbnail: isVideo ? undefined : localUrl, fileId: Date.now(), size: `${(file.size / 1024).toFixed(0)} KB` });
    }
    message.success('Đã thêm file!');
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div style={{ width: 220, height: '100%', background: '#161616', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AppstoreOutlined style={{ color: '#1890ff' }} /> Bộ sưu tập
        </div>
        <Tooltip title="Thêm file mới">
          <label style={{ cursor: uploading ? 'default' : 'pointer' }}>
            <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            <PlusOutlined style={{ color: '#1890ff', fontSize: 14, opacity: uploading ? 0.5 : 1 }} />
          </label>
        </Tooltip>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {/* Images */}
        {images.length > 0 && (
          <>
            <SectionHeader icon={<PictureOutlined />} label="Hình ảnh" count={images.length} color="#52c41a" />
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {images.map(f => (
                <FileCard key={f.id} file={f} active={activeFile?.id === f.id} onClick={() => setActiveFile(f)} onRemove={() => removeFile(f.id)} />
              ))}
            </div>
          </>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <>
            <SectionHeader icon={<VideoCameraOutlined />} label="Video" count={videos.length} color="#1890ff" />
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {videos.map(f => (
                <FileCard key={f.id} file={f} active={activeFile?.id === f.id} onClick={() => setActiveFile(f)} onRemove={() => removeFile(f.id)} />
              ))}
            </div>
          </>
        )}

        {/* Extracted frames */}
        {frames.length > 0 && (
          <>
            <SectionHeader icon={<FolderOpenOutlined />} label="Khung hình" count={frames.length} color="#f5a623" />
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {frames.map(f => (
                <FileCard key={f.id} file={f} active={activeFile?.id === f.id} onClick={() => setActiveFile(f)} onRemove={() => removeFile(f.id)} />
              ))}
            </div>
          </>
        )}

        {files.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#444', fontSize: 12 }}>
            <FolderOpenOutlined style={{ fontSize: 28, marginBottom: 8, display: 'block' }} />
            Chưa có file nào
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
