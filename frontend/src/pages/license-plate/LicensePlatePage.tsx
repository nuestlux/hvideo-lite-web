import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Upload, Checkbox, Select, Slider, Button, Tag, Typography, message, Space, Divider, InputNumber } from 'antd';
const { Text, Title } = Typography;
import { UploadOutlined, EditOutlined, SettingOutlined, PlayCircleOutlined, RotateLeftOutlined, RotateRightOutlined, SwapOutlined, ReloadOutlined, VideoCameraOutlined, PictureOutlined, ScissorOutlined } from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { filesApi } from '../../api/files';
import { aiApi } from '../../api/ai';
import { useNavigate } from 'react-router-dom';

const COUNTRIES = [
  { value: 'VN', label: 'Việt Nam' },
  { value: 'US', label: 'Hoa Kỳ' },
  { value: 'JP', label: 'Nhật Bản' },
  { value: 'KR', label: 'Hàn Quốc' },
];

const LicensePlatePage: React.FC = () => {
  const navigate = useNavigate();
  const [fileId, setFileId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [freeRotate, setFreeRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hue, setHue] = useState(0);
  const [sharpness, setSharpness] = useState(50);
  const [exposure, setExposure] = useState(0);

  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropApplied, setCropApplied] = useState(false);

  const [inputMode, setInputMode] = useState<'image' | 'video'>('image');
  const [frames, setFrames] = useState<{ index: number; time: number; url?: string }[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);

  const [countries, setCountries] = useState<string[]>(['VN']);
  const [vehicleType, setVehicleType] = useState('car');
  const [plateColor, setPlateColor] = useState('white');

  const handleUpload = async (f: File) => {
    setUploading(true);
    try {
      const res = await filesApi.upload(f);
      setFileId(res.data.data.id);
      const url = URL.createObjectURL(f);
      setIsVideo(f.type.startsWith('video/'));
      if (f.type.startsWith('video/')) {
        setPreview('');
        try {
          const framesRes = await aiApi.extractFrames(res.data.data.id);
          setFrames(framesRes.data.data.frames || []);
        } catch {
          setFrames([{ index: 0, time: 0 }, { index: 1, time: 1 }, { index: 2, time: 2 }]);
        }
        message.success('Tải video thành công. Chọn frame để xử lý.');
      } else {
        setPreview(url);
        setFrames([]);
        setCropApplied(false);
        message.success('Tải ảnh thành công');
      }
    } catch {
      message.error('Tải file thất bại');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const applyCrop = () => {
    setCropMode(false);
    setCropApplied(true);
    message.success('Đã crop ảnh');
  };

  const cancelCrop = () => {
    setCropMode(false);
    setCropApplied(false);
    setCroppedAreaPixels(null);
  };

  const handleProcess = async () => {
    if (!fileId) { message.error('Vui lòng tải ảnh lên'); return; }
    const adjustments = {
      brightness, contrast, saturation,
      rotate: rotate + freeRotate,
      flip_h: flipH, flip_v: flipV,
      zoom, hue, sharpness, exposure,
    };
    if (cropApplied && croppedAreaPixels) {
      (adjustments as any).crop = {
        x: Math.round(croppedAreaPixels.x),
        y: Math.round(croppedAreaPixels.y),
        w: Math.round(croppedAreaPixels.width),
        h: Math.round(croppedAreaPixels.height),
      };
    }
    navigate('/license-plate/results', {
      state: {
        fileId,
        countries: countries.length > 0 ? countries : ['VN'],
        vehicleType,
        plateColor,
        adjustments,
      },
    });
  };

  const filterStyle = {
    filter: `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100}) hue-rotate(${hue}deg) brightness(${exposure >= 0 ? 1 + exposure : 1})`,
    transform: `rotate(${rotate + freeRotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${zoom})`,
    maxWidth: '100%', maxHeight: 400, transition: 'all 0.3s',
  };

  return (
    <>
      <Title level={4}>Phục hồi biển số xe</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={isVideo ? 'Video đầu vào' : 'Ảnh đầu vào'}
            extra={
              <Space>
                <Button
                  type={inputMode === 'image' ? 'primary' : 'default'}
                  size="small" icon={<PictureOutlined />}
                  onClick={() => { setInputMode('image'); setIsVideo(false); setPreview(''); setFrames([]); }}
                >Ảnh</Button>
                <Button
                  type={inputMode === 'video' ? 'primary' : 'default'}
                  size="small" icon={<VideoCameraOutlined />}
                  onClick={() => { setInputMode('video'); setIsVideo(false); setPreview(''); setFrames([]); }}
                >Video</Button>
                <Upload
                  accept={inputMode === 'image' ? "image/jpeg,image/png,image/webp" : "video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/x-flv,video/webm"}
                  showUploadList={false} beforeUpload={handleUpload}
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    {inputMode === 'image' ? 'Tải ảnh' : 'Tải video'}
                  </Button>
                </Upload>
              </Space>
            }
          >
            {preview && cropMode ? (
              <div style={{ position: 'relative', width: '100%', height: 400, background: '#333' }}>
                <Cropper
                  image={preview}
                  crop={crop}
                  zoom={cropZoom}
                  aspect={4 / 3}
                  onCropChange={setCrop}
                  onZoomChange={setCropZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
            ) : preview ? (
              <div style={{ textAlign: 'center', overflow: 'hidden' }}>
                <img src={preview} alt="preview" style={filterStyle} />
              </div>
            ) : frames.length > 0 ? (
              <div>
                <Text strong>Chọn frame để xử lý:</Text>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {frames.map((f) => (
                    <div
                      key={f.index}
                      onClick={() => { setSelectedFrame(f.index); setPreview(`#frame-${f.index}`); }}
                      style={{
                        width: 120, height: 80, cursor: 'pointer', borderRadius: 4, overflow: 'hidden',
                        border: selectedFrame === f.index ? '2px solid #1890ff' : '2px solid #d9d9d9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#f5f5f5', flexDirection: 'column',
                      }}
                    >
                      {f.url ? (
                        <img src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <VideoCameraOutlined style={{ fontSize: 24, color: '#999' }} />
                      )}
                      <span style={{ fontSize: 10 }}>{f.time}s</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                <UploadOutlined style={{ fontSize: 48 }} />
                <p>{inputMode === 'image' ? 'Tải ảnh (JPG/PNG/WEBP, tối đa 20 MB)' : 'Tải video để trích xuất frame'}</p>
              </div>
            )}
          </Card>

          {preview && (
            <Card title={<><EditOutlined /> Chỉnh sửa ảnh</>} style={{ marginTop: 16 }}>
              <Space style={{ marginBottom: 12 }}>
                {cropMode ? (
                  <>
                    <Button type="primary" icon={<ScissorOutlined />} onClick={applyCrop}>Áp dụng crop</Button>
                    <Button onClick={cancelCrop}>Hủy crop</Button>
                  </>
                ) : (
                  <Button icon={<ScissorOutlined />} onClick={() => setCropMode(true)}>Kéo crop</Button>
                )}
              </Space>
              {cropApplied && <Tag color="green" style={{ marginBottom: 8 }}>Đã crop</Tag>}

              <Row gutter={16}>
                <Col span={12}>
                  <Text>Độ sáng ({brightness})</Text>
                  <Slider min={-100} max={100} value={brightness} onChange={setBrightness} />
                </Col>
                <Col span={12}>
                  <Text>Độ tương phản ({contrast})</Text>
                  <Slider min={-100} max={100} value={contrast} onChange={setContrast} />
                </Col>
                <Col span={12}>
                  <Text>Độ bão hòa ({saturation})</Text>
                  <Slider min={-100} max={100} value={saturation} onChange={setSaturation} />
                </Col>
                <Col span={12}>
                  <Text>Zoom ({zoom.toFixed(1)}x)</Text>
                  <Slider min={0.5} max={3} step={0.1} value={zoom} onChange={setZoom} />
                </Col>
                <Col span={12}>
                  <Text>Hue ({hue}°)</Text>
                  <Slider min={-180} max={180} value={hue} onChange={setHue} />
                </Col>
                <Col span={12}>
                  <Text>Sharpness ({sharpness})</Text>
                  <Slider min={0} max={100} value={sharpness} onChange={setSharpness} />
                </Col>
                <Col span={12}>
                  <Text>Exposure ({exposure})</Text>
                  <Slider min={-2} max={2} step={0.1} value={exposure} onChange={setExposure} />
                </Col>
              </Row>

              <div style={{ marginTop: 12 }}>
                <Text strong>Xoay</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Slider
                    style={{ flex: 1 }}
                    min={-180} max={180}
                    value={freeRotate}
                    onChange={setFreeRotate}
                  />
                  <InputNumber
                    min={-180} max={180}
                    value={freeRotate}
                    onChange={(v) => setFreeRotate(v ?? 0)}
                    style={{ width: 70 }}
                    size="small"
                  />
                  <Text type="secondary">°</Text>
                </div>
              </div>

              <Space style={{ marginTop: 12 }}>
                <Button icon={<RotateLeftOutlined />} onClick={() => setRotate(r => r - 90)}>Xoay trái</Button>
                <Button icon={<RotateRightOutlined />} onClick={() => setRotate(r => r + 90)}>Xoay phải</Button>
                <Button icon={<SwapOutlined />} onClick={() => setFlipH(h => !h)}>Lật ngang</Button>
                <Button icon={<SwapOutlined style={{ transform: 'rotate(90deg)' }} />} onClick={() => setFlipV(v => !v)}>Lật dọc</Button>
                <Button icon={<ReloadOutlined />} onClick={() => {
                  setBrightness(0); setContrast(0); setSaturation(0); setRotate(0); setFreeRotate(0);
                  setFlipH(false); setFlipV(false); setZoom(1); setHue(0); setSharpness(50); setExposure(0);
                  setCropMode(false); setCropApplied(false); setCroppedAreaPixels(null);
                }}>Reset</Button>
              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<><SettingOutlined /> Cấu hình biển số</>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Quốc gia</Text>
                <Checkbox.Group
                  value={countries}
                  onChange={setCountries}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}
                >
                  {COUNTRIES.map(c => (
                    <Checkbox key={c.value} value={c.value}>{c.label}</Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
              <div>
                <Text strong>Loại xe</Text>
                <Select value={vehicleType} onChange={setVehicleType} style={{ width: '100%' }}
                  options={[
                    { value: 'car', label: 'Ô tô' },
                    { value: 'motorcycle', label: 'Xe máy' },
                    { value: 'truck', label: 'Xe tải' },
                  ]}
                />
              </div>
              <div>
                <Text strong>Màu biển</Text>
                <Select value={plateColor} onChange={setPlateColor} style={{ width: '100%' }}
                  options={[
                    { value: 'white', label: 'Trắng' },
                    { value: 'black', label: 'Đen' },
                    { value: 'yellow', label: 'Vàng' },
                    { value: 'blue', label: 'Xanh' },
                  ]}
                />
              </div>
              <Divider />
              <Button
                type="primary" icon={<PlayCircleOutlined />} size="large" block
                loading={false} onClick={handleProcess}
                disabled={!fileId || countries.length === 0}
              >
                Xử lý ({countries.length} model)
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default LicensePlatePage;
