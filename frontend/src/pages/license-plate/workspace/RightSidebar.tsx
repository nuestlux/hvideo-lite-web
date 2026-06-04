import React, { useState } from 'react';
import { Slider, Tag } from 'antd';
import { useWorkspace } from './WorkspaceContext';
import {
  SunOutlined, BgColorsOutlined, CompressOutlined, ControlOutlined,
  ThunderboltOutlined, GlobalOutlined
} from '@ant-design/icons';

const SliderRow: React.FC<{ label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string; icon?: React.ReactNode }> = ({ label, value, onChange, min = -100, max = 100, color = '#1890ff', icon }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#aaa', fontSize: 12 }}>
        {icon && <span style={{ color }}>{icon}</span>}
        {label}
      </div>
      <div style={{ color, fontSize: 12, fontWeight: 700, background: '#1a1a1a', borderRadius: 4, padding: '1px 8px', minWidth: 38, textAlign: 'center' }}>
        {value > 0 ? '+' : ''}{value}
      </div>
    </div>
    <Slider
      min={min} max={max} value={value}
      onChange={onChange}
      railStyle={{ background: '#2a2a2a', height: 3 }}
      trackStyle={{ background: color, height: 3 }}
      handleStyle={{ borderColor: color, background: color, width: 12, height: 12, marginTop: -4 }}
    />
  </div>
);

const RightSidebar: React.FC<{ onProcess: (config: any) => void }> = ({ onProcess }) => {
  const { activeFile, brightness, setBrightness, contrast, setContrast, sharpness, setSharpness, noiseReduction, setNoiseReduction, saturation, setSaturation, resetAdjustments } = useWorkspace();

  const [countries, setCountries] = useState<string[]>(['VN']);
  const [vehicleType, setVehicleType] = useState('car');
  const [plateColor, setPlateColor] = useState('white');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('adjust');

  const hasAdjustments = brightness !== 0 || contrast !== 0 || sharpness !== 0 || noiseReduction !== 0 || saturation !== 0;
  const adjustCount = [brightness, contrast, sharpness, noiseReduction, saturation].filter(v => v !== 0).length;

  const handleProcess = async () => {
    if (!activeFile) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    setProcessing(false);
    onProcess({ countries, vehicleType, plateColor, adjustments: { brightness, contrast, sharpness, noiseReduction, saturation } });
  };

  if (!activeFile) {
    return (
      <div style={{ width: 280, height: '100%', background: '#161616', borderLeft: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 12, flexDirection: 'column', gap: 8 }}>
        <ControlOutlined style={{ fontSize: 32 }} />
        <div>Chọn file để chỉnh sửa</div>
      </div>
    );
  }

  // Video panel: only extraction
  if (activeFile.type === 'video') {
    return (
      <div style={{ width: 280, height: '100%', background: '#161616', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #222', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ThunderboltOutlined style={{ color: '#1890ff' }} /> Trích xuất khung hình
        </div>
        <div style={{ padding: 16, flex: 1 }}>
          <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 16, border: '1px solid #2a2a2a' }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>HƯỚNG DẪN</div>
            <ol style={{ color: '#666', fontSize: 12, margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Dùng video player để di chuyển đến khung hình cần lấy</li>
              <li>Nhấn <span style={{ color: '#1890ff' }}>Trích xuất khung hình</span> trên thanh công cụ</li>
              <li>Khung hình sẽ xuất hiện trong bộ sưu tập bên trái</li>
              <li>Chọn khung hình và nhấn Xử lý biển số</li>
            </ol>
          </div>

          <div style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>THÔNG TIN VIDEO</div>
          <div style={{ background: '#1a1a1a', borderRadius: 6, overflow: 'hidden', border: '1px solid #222' }}>
            {[
              ['Tên file', activeFile.name],
              ['Thời lượng', activeFile.duration || 'N/A'],
              ['Dung lượng', activeFile.size || 'N/A'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', padding: '8px 12px', borderBottom: '1px solid #222' }}>
                <div style={{ color: '#555', fontSize: 11, width: 80, flexShrink: 0 }}>{k}</div>
                <div style={{ color: '#ccc', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Image / Frame panel: adjustments + config
  return (
    <div style={{ width: 280, height: '100%', background: '#161616', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #222', display: 'flex' }}>
        {[{ key: 'adjust', label: 'Chỉnh sửa', icon: <SunOutlined /> }, { key: 'config', label: 'Nhận diện', icon: <GlobalOutlined /> }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, height: 40, background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #1890ff' : '2px solid transparent',
              color: activeTab === tab.key ? '#1890ff' : '#666',
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s'
            }}
          >
            {tab.icon} {tab.label}
            {tab.key === 'adjust' && adjustCount > 0 && (
              <span style={{ background: '#1890ff', borderRadius: 10, color: '#fff', fontSize: 10, padding: '0 5px', marginLeft: 2 }}>{adjustCount}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {activeTab === 'adjust' ? (
          <>
            {/* Histogram preview placeholder */}
            <div style={{ background: '#111', borderRadius: 6, height: 60, marginBottom: 16, overflow: 'hidden', position: 'relative', border: '1px solid #222' }}>
              <svg width="100%" height="100%" viewBox="0 0 248 60" preserveAspectRatio="none">
                <defs><linearGradient id="hg" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#1890ff" stopOpacity="0.8"/>
                  <stop offset="50%" stopColor="#52c41a" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#ff4d4f" stopOpacity="0.5"/>
                </linearGradient></defs>
                <path d="M0 60 Q30 20 60 30 Q90 40 120 10 Q150 0 180 25 Q210 45 248 60Z" fill="url(#hg)" opacity="0.6"/>
                <path d="M0 60 Q20 40 50 45 Q80 50 110 30 Q140 10 160 35 Q190 55 248 60Z" fill="url(#hg)" opacity="0.3"/>
              </svg>
              <div style={{ position: 'absolute', top: 4, right: 8, color: '#444', fontSize: 10 }}>Histogram</div>
            </div>

            <SliderRow label="Độ sáng" value={brightness} onChange={setBrightness} icon={<SunOutlined />} color="#fadb14" />
            <SliderRow label="Tương phản" value={contrast} onChange={setContrast} icon={<span style={{ fontWeight: 700, fontSize: 11 }}>C</span>} color="#ff7a45" />
            <SliderRow label="Bão hoà màu" value={saturation} onChange={setSaturation} icon={<BgColorsOutlined />} color="#eb2f96" />
            <SliderRow label="Độ sắc nét" value={sharpness} onChange={setSharpness} icon={<span style={{ fontWeight: 700, fontSize: 11 }}>S</span>} color="#1890ff" />
            <SliderRow label="Giảm nhiễu" value={noiseReduction} onChange={setNoiseReduction} min={0} max={100} icon={<CompressOutlined />} color="#722ed1" />

            {hasAdjustments && (
              <button
                onClick={resetAdjustments}
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#888', cursor: 'pointer', padding: '6px 0', fontSize: 12, marginTop: 8 }}
              >
                ↺ Đặt lại tất cả
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>QUỐC GIA NHẬN DIỆN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[{ code: 'VN', label: '🇻🇳  Việt Nam', color: '#1890ff' }, { code: 'US', label: '🇺🇸  Hoa Kỳ', color: '#52c41a' }, { code: 'JP', label: '🇯🇵  Nhật Bản', color: '#ff7a45' }, { code: 'KR', label: '🇰🇷  Hàn Quốc', color: '#722ed1' }].map(c => (
                <label key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', background: countries.includes(c.code) ? '#1a2a3a' : '#1a1a1a', borderRadius: 6, border: `1px solid ${countries.includes(c.code) ? c.color + '55' : '#222'}`, transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={countries.includes(c.code)} onChange={e => setCountries(prev => e.target.checked ? [...prev, c.code] : prev.filter(x => x !== c.code))} style={{ accentColor: c.color, width: 14, height: 14 }} />
                  <span style={{ color: countries.includes(c.code) ? '#ddd' : '#666', fontSize: 13 }}>{c.label}</span>
                </label>
              ))}
            </div>

            <div style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>LOẠI XE</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {[{ v: 'car', l: '🚗 Ô tô' }, { v: 'motorcycle', l: '🏍️ Xe máy' }, { v: 'truck', l: '🚛 Xe tải' }].map(({ v, l }) => (
                <button key={v} onClick={() => setVehicleType(v)} style={{ flex: 1, minWidth: 70, padding: '7px 4px', background: vehicleType === v ? '#1890ff22' : '#1a1a1a', border: `1px solid ${vehicleType === v ? '#1890ff' : '#2a2a2a'}`, borderRadius: 6, color: vehicleType === v ? '#1890ff' : '#666', cursor: 'pointer', fontSize: 12 }}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>MÀU BIỂN SỐ</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[{ v: 'white', l: 'Trắng', bg: '#fff', fg: '#000' }, { v: 'yellow', l: 'Vàng', bg: '#fadb14', fg: '#000' }, { v: 'blue', l: 'Xanh', bg: '#1890ff', fg: '#fff' }, { v: 'black', l: 'Đen', bg: '#141414', fg: '#fff' }].map(({ v, l, bg, fg }) => (
                <button key={v} onClick={() => setPlateColor(v)} title={l} style={{ flex: 1, height: 30, background: bg, border: `2px solid ${plateColor === v ? '#1890ff' : 'transparent'}`, borderRadius: 6, color: fg, cursor: 'pointer', fontSize: 11, fontWeight: 600, boxShadow: plateColor === v ? '0 0 0 2px #1890ff55' : 'none' }}>
                  {l[0]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Process button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #222', background: '#111' }}>
        {activeFile.fileId && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#555', fontSize: 11 }}>Mô hình AI</span>
              <span style={{ color: '#1890ff', fontSize: 11 }}>{countries.length} quốc gia</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {countries.map(c => <Tag key={c} color="blue" style={{ fontSize: 10, margin: 0 }}>{c}</Tag>)}
            </div>
          </div>
        )}
        <button
          onClick={handleProcess}
          disabled={processing || countries.length === 0}
          style={{
            width: '100%', height: 38, background: processing ? '#135200' : 'linear-gradient(135deg, #1890ff, #096dd9)',
            border: 'none', borderRadius: 8, color: '#fff', cursor: processing || countries.length === 0 ? 'default' : 'pointer',
            fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: countries.length === 0 ? 0.5 : 1,
            transition: 'all 0.2s',
            boxShadow: processing ? 'none' : '0 4px 12px rgba(24,144,255,0.35)'
          }}
        >
          {processing ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
              Đang xử lý...
            </>
          ) : (
            <><ThunderboltOutlined /> Xử lý biển số</>
          )}
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;
