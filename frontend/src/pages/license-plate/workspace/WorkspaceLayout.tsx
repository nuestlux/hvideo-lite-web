import React from 'react';
import { ConfigProvider, theme, Grid } from 'antd';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import CenterCanvas from './CenterCanvas';
import TopToolbar from './TopToolbar';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { useBreakpoint } = Grid;

const WorkspaceContent: React.FC = () => {
  const navigate = useNavigate();
  const { activeFile, brightness, contrast, sharpness, noiseReduction, saturation } = useWorkspace();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const handleProcess = (config: any) => {
    if (!activeFile?.fileId) return;
    navigate('/license-plate/results', {
      state: {
        fileId: activeFile.fileId,
        countries: config.countries,
        vehicleType: config.vehicleType,
        plateColor: config.plateColor,
        adjustments: { brightness, contrast, sharpness, noiseReduction, saturation }
      }
    });
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          colorBgBase: '#141414',
          borderRadius: 6,
          fontSize: 13,
        }
      }}
    >
      {/* Full-screen IDE layout */}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0d0d', overflow: 'hidden' }}>
        {/* Title bar */}
        <div style={{
          height: 40, background: '#111', borderBottom: '1px solid #1a1a1a',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
          userSelect: 'none',
        }}>
          <button
            onClick={() => window.history.back()}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 8px', borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeftOutlined /> Quay lại
          </button>
          <div style={{ width: 1, height: 18, background: '#2a2a2a' }} />
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>
            Workspace — Làm rõ biển số
          </div>
          {activeFile && (
            <div style={{ color: '#555', fontSize: 12 }}>
              / {activeFile.name}
            </div>
          )}
          {/* Window controls (decorative) */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
          </div>
        </div>

        {/* Toolbar */}
        <TopToolbar />

        {/* Main panels */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: isMobile ? 'auto' : 'hidden'
        }}>
          <LeftSidebar />
          <CenterCanvas />
          <RightSidebar onProcess={handleProcess} />
        </div>
      </div>
    </ConfigProvider>
  );
};

const WorkspaceLayout: React.FC = () => (
  <WorkspaceProvider>
    <WorkspaceContent />
  </WorkspaceProvider>
);

export default WorkspaceLayout;
