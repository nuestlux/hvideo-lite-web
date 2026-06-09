import React, { useState, useEffect } from 'react';
import { Upload, Button, Tag, Typography, message, Steps, Space, Progress, Result, Row, Col, Spin } from 'antd';
const { Text, Title } = Typography;
const { Dragger } = Upload;
import { 
  CloudUploadOutlined, BugOutlined, CheckCircleOutlined, 
  FileTextOutlined, DownloadOutlined, StepForwardOutlined, InboxOutlined, 
  VideoCameraOutlined, SettingOutlined
} from '@ant-design/icons';
import { filesApi } from '../../api/files';
import { aiApi } from '../../api/ai';
import type { Job, VideoAnalysis } from '../../api/ai';

const errorLabels: Record<string, string> = {
  moov_atom: 'Mất moov atom',
  header_checksum: 'Lỗi Header checksum',
  idx1_missing: 'Thiếu index chunk',
  codec_error: 'Lỗi Codec',
  keyframe_loss: 'Mất Keyframe',
  sync_loss: 'Mất đồng bộ AV',
  frame_drop: 'Rơi rớt Frame',
  timestamp_corrupt: 'Sai Timestamp',
  bitrate_low: 'Bitrate thấp',
  duration_mismatch: 'Sai Duration',
};

const loadingPhrases = [
  'Đang nạp file vào hệ thống...',
  'Đang quét cấu trúc Header...',
  'Đang xử lý khôi phục moov atom...',
  'AI đang tái tạo frame bị hỏng...',
  'Đang đồng bộ lại âm thanh và hình ảnh...',
  'Đang xuất video hoàn chỉnh...'
];

const VideoRepairPage: React.FC = () => {
  const [step, setStep] = useState(0);

  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFileId, setMainFileId] = useState<number | null>(null);
  const [, setUploading] = useState(false);

  const [refFile, setRefFile] = useState<File | null>(null);
  const [refFileId, setRefFileId] = useState<number | null>(null);
  const [, setRefUploading] = useState(false);
  const [showRefUpload, setShowRefUpload] = useState(false);

  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const [repairMethod, setRepairMethod] = useState<string>('auto_basic');

  const [job, setJob] = useState<Job | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

  useEffect(() => {
    let interval: any;
    if (processing && step === 2) {
      interval = setInterval(() => {
        setLoadingPhraseIndex(prev => (prev + 1) % loadingPhrases.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [processing, step]);

  const handleUploadMain = async (f: File) => {
    setUploading(true);
    try {
      const res = await filesApi.upload(f);
      setMainFileId(res.data.data.id);
      setMainFile(f);
      setAnalysis(null);
      setJob(null);
      setStep(0);
      message.success('Tải video thành công');
    } catch { message.error('Tải video thất bại'); } finally { setUploading(false); }
    return false;
  };

  const handleUploadRef = async (f: File) => {
    setRefUploading(true);
    try {
      const res = await filesApi.upload(f);
      setRefFileId(res.data.data.id);
      setRefFile(f);
      message.success('Tải file mẫu thành công');
    } catch { message.error('Tải file mẫu thất bại'); } finally { setRefUploading(false); }
    return false;
  };

  const handleAnalyze = async () => {
    if (!mainFileId) { message.error('Vui lòng tải video lên'); return; }
    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysis(null);
    const prog = setInterval(() => setAnalysisProgress(p => Math.min(p + 15, 95)), 300);
    try {
      const res = await aiApi.analyzeVideo(mainFileId);
      setAnalysis(res.data.data);
      setAnalysisProgress(100);
      clearInterval(prog);
      setTimeout(() => setStep(1), 500);
    } catch (err: any) {
      console.error('Analyze video error:', err);
      const msg = err?.response?.data?.detail?.message || err?.message || 'Phân tích thất bại';
      message.error(msg);
      clearInterval(prog);
    } finally { setAnalyzing(false); }
  };

  const startPolling = (jobId: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await aiApi.getJob(jobId);
        setJob(res.data.data);
        if (res.data.data.status === 'completed' || res.data.data.status === 'failed') {
          clearInterval(interval);
          setPollInterval(null);
          setProcessing(false);
          if (res.data.data.status === 'completed') setStep(3);
        }
      } catch { clearInterval(interval); setPollInterval(null); setProcessing(false); }
    }, 2000);
    setPollInterval(interval);
  };

  const handleRepair = async () => {
    if (!mainFileId) { message.error('Vui lòng tải video lên'); return; }
    setProcessing(true);
    setLoadingPhraseIndex(0);
    setJob(null);
    try {
      const config = {
        codec: 'H.264',
        repair_level: repairMethod === 'auto_ai' ? 3 : 1,
        keep_audio: true,
        repair_method: repairMethod,
        reference_file_id: repairMethod === 'reference' ? refFileId : null,
      };
      let module = 'video_repair_basic';
      if (repairMethod === 'auto_ai') module = 'video_repair_pro';
      else if (repairMethod === 'reference') module = 'video_repair_reference';
      const params: any = { module, file_id: mainFileId, config: JSON.stringify(config) };
      if (config.reference_file_id) params.reference_file_id = config.reference_file_id;
      const res = await aiApi.processAdvanced(params);
      const jobData = res.data.data as unknown as Job;
      setJob(jobData);
      startPolling(jobData.id);
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Sửa video thất bại';
      message.error(msg);
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep(0); setMainFile(null); setMainFileId(null); setRefFile(null); setRefFileId(null);
    setAnalysis(null); setJob(null); setAnalysisProgress(0); setRepairMethod('auto_basic');
    setShowRefUpload(false);
  };

  const steps = [
    { title: 'Tải lên', icon: <CloudUploadOutlined /> },
    { title: 'Chẩn đoán', icon: <BugOutlined /> },
    { title: 'Sửa chữa', icon: <SettingOutlined /> },
    { title: 'Hoàn thành', icon: <CheckCircleOutlined /> },
  ];

  return (
    <div style={{ padding: '0 12px', maxWidth: 1080, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 8, fontWeight: 600 }}>Trợ lý Phục hồi Video AI</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>Khôi phục video bị hỏng, mất frame, lỗi header hoặc không mở được bằng công nghệ AI tiên tiến</Text>
      </div>

      <Steps 
        current={step} 
        items={steps} 
        style={{ marginBottom: 32 }} 
        size="small"
      />

      {/* Step 0: Upload - Modern premium style */}
      {step === 0 && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          {!mainFile ? (
            <div style={{ 
              background: '#fff', 
              padding: '48px 40px', 
              borderRadius: 24, 
              boxShadow: '0 12px 48px rgba(0,0,0,0.06)', 
              textAlign: 'center',
              border: '1px solid #f0f0f0'
            }}>
              <Dragger 
                accept="video/*" 
                showUploadList={false} 
                beforeUpload={handleUploadMain}
                style={{ 
                  background: 'linear-gradient(145deg, #f8faff 0%, #ffffff 100%)', 
                  border: '2px dashed #d0d9ff', 
                  borderRadius: 20, 
                  padding: '56px 32px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <div style={{ 
                    width: 80, height: 80, 
                    background: 'linear-gradient(135deg, #1677ff 0%, #3b82f6 100%)', 
                    borderRadius: '50%', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: 20,
                    boxShadow: '0 8px 24px rgba(22, 119, 255, 0.25)'
                  }}>
                    <CloudUploadOutlined style={{ fontSize: 42, color: '#fff' }} />
                  </div>
                </div>
                <Title level={3} style={{ marginBottom: 8, fontWeight: 600 }}>Kéo thả video hỏng vào đây</Title>
                <Text type="secondary" style={{ fontSize: 15 }}>Hoặc click để chọn file từ máy tính</Text>
                
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Tag style={{ padding: '4px 12px', fontSize: 13 }}>MP4</Tag>
                  <Tag style={{ padding: '4px 12px', fontSize: 13 }}>MOV</Tag>
                  <Tag style={{ padding: '4px 12px', fontSize: 13 }}>AVI</Tag>
                  <Tag style={{ padding: '4px 12px', fontSize: 13 }}>MKV</Tag>
                </div>
                <Text type="secondary" style={{ marginTop: 12, display: 'block', fontSize: 13 }}>
                  Tối đa 500MB • Hỗ trợ hầu hết định dạng video thông dụng
                </Text>
              </Dragger>
            </div>
          ) : (
            <div style={{ 
              background: '#fff', 
              padding: 28, 
              borderRadius: 20, 
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
              border: '1px solid #f0f0f0'
            }}>
              <Row gutter={20} align="middle">
                <Col xs={24} md={7}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #111 0%, #1f1f1f 100%)', 
                    borderRadius: 14, 
                    overflow: 'hidden', 
                    height: 148, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <VideoCameraOutlined style={{ fontSize: 52, color: '#555' }} />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 10, 
                      right: 10, 
                      background: 'rgba(0,0,0,0.6)', 
                      color: '#fff', 
                      fontSize: 11, 
                      padding: '2px 8px', 
                      borderRadius: 4 
                    }}>
                      {(mainFile.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={17}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <Title level={4} style={{ margin: 0, color: '#111', fontWeight: 600 }}>{mainFile.name}</Title>
                      <Tag color="blue" style={{ marginLeft: 4 }}>Đã tải lên</Tag>
                    </div>
                    <Text type="secondary">Video cần khôi phục</Text>
                  </div>

                  <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<BugOutlined />} 
                      onClick={handleAnalyze} 
                      loading={analyzing}
                      style={{ borderRadius: 10, height: 48, padding: '0 28px', fontWeight: 500 }}
                    >
                      Phân tích & Chẩn đoán lỗi
                    </Button>
                    <Button 
                      size="large" 
                      onClick={() => setMainFile(null)} 
                      style={{ borderRadius: 10, height: 48 }}
                    >
                      Chọn video khác
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {analyzing && (
            <div style={{ 
              marginTop: 20, 
              background: '#fff', 
              padding: '22px 26px', 
              borderRadius: 16, 
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text strong style={{ fontSize: 15 }}>AI đang phân tích cấu trúc video...</Text>
                <Text type="secondary">{analysisProgress}%</Text>
              </div>
              <Progress 
                percent={analysisProgress} 
                status="active" 
                showInfo={false} 
                strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }} 
                strokeWidth={6}
              />
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                Đang kiểm tra header, index, moov atom và các lỗi phổ biến...
              </Text>
            </div>
          )}

          {/* Optional Reference File - Modern & subtle */}
          <div style={{ marginTop: 20 }}>
            {!showRefUpload ? (
              <Button 
                type="default" 
                block 
                onClick={() => setShowRefUpload(true)} 
                style={{ 
                  height: 46, 
                  borderRadius: 12, 
                  border: '1px dashed #bfbfbf',
                  color: '#595959',
                  fontWeight: 500
                }}
              >
                + Có video quay cùng camera (không bị lỗi)? Thêm file tham chiếu để tăng độ chính xác
              </Button>
            ) : (
              <div style={{ 
                background: '#fafcff', 
                border: '1px solid #e0e7ff', 
                borderRadius: 16, 
                padding: 22 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <Text strong style={{ fontSize: 15 }}><FileTextOutlined /> File tham chiếu (khuyến nghị)</Text>
                    <div style={{ marginTop: 2 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Video quay cùng thiết bị → AI sẽ tái tạo chính xác hơn rất nhiều</Text>
                    </div>
                  </div>
                  <Button type="text" size="small" onClick={() => setShowRefUpload(false)}>Đóng</Button>
                </div>

                {!refFile ? (
                  <Dragger 
                    accept="video/*" 
                    showUploadList={false} 
                    beforeUpload={handleUploadRef}
                    style={{ background: '#fff', borderRadius: 12, border: '1px dashed #c9d4ff' }}
                  >
                    <p className="ant-upload-drag-icon" style={{ marginBottom: 6 }}>
                      <InboxOutlined style={{ color: '#1677ff', fontSize: 28 }} />
                    </p>
                    <p className="ant-upload-text" style={{ margin: 0, fontSize: 14 }}>Kéo thả hoặc click để tải file mẫu</p>
                  </Dragger>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    background: '#fff', 
                    padding: '12px 16px', 
                    borderRadius: 10, 
                    border: '1px solid #d9e0ff' 
                  }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                      <Text strong>{refFile.name}</Text>
                    </div>
                    <Button size="small" danger onClick={() => { setRefFile(null); setRefFileId(null); }}>
                      Gỡ bỏ
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Diagnosis + Repair Method (Premium modern cards) */}
      {step === 1 && analysis && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <Row gutter={20}>
            {/* Left: Diagnosis Report */}
            <Col xs={24} lg={9}>
              <div style={{ 
                background: '#fff', 
                borderRadius: 20, 
                padding: 24, 
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)', 
                height: '100%',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ 
                    width: 44, height: 44, 
                    background: '#fff1f0', 
                    color: '#ff4d4f', 
                    borderRadius: 12, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 22 
                  }}>
                    <BugOutlined />
                  </div>
                  <div>
                    <Title level={5} style={{ margin: 0, fontWeight: 600 }}>Báo cáo chẩn đoán</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Phân tích tự động</Text>
                  </div>
                </div>

                <div style={{ background: '#fafafa', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text type="secondary">Trạng thái</Text>
                    {analysis.repairable 
                      ? <Tag color="success" style={{ margin: 0, borderRadius: 6 }}>Có thể khôi phục</Tag> 
                      : <Tag color="error" style={{ margin: 0, borderRadius: 6 }}>Khó khôi phục</Tag>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Kích thước</Text>
                    <Text strong>{(analysis.file_size / 1024 / 1024).toFixed(1)} MB</Text>
                  </div>
                </div>

                <Text strong style={{ fontSize: 14 }}>Lỗi phát hiện ({analysis.errors.length})</Text>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {analysis.errors.map((err, i) => (
                    <Tag 
                      key={i} 
                      color={err.severity === 'critical' ? 'error' : 'warning'} 
                      style={{ padding: '3px 9px', borderRadius: 6, fontSize: 12 }}
                    >
                      {errorLabels[err.type] || err.type}
                    </Tag>
                  ))}
                </div>
              </div>
            </Col>

            {/* Right: Choose Repair Method - Beautiful cards */}
            <Col xs={24} lg={15}>
              <div style={{ 
                background: '#fff', 
                borderRadius: 20, 
                padding: '26px 28px', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                border: '1px solid #f0f0f0'
              }}>
                <Title level={5} style={{ marginBottom: 18, fontWeight: 600 }}>Chọn cách khôi phục</Title>

                {/* Reference method - only if uploaded */}
                {refFile && (
                  <div
                    onClick={() => setRepairMethod('reference')}
                    style={{
                      padding: '16px 18px',
                      border: repairMethod === 'reference' ? '2px solid #52c41a' : '1px solid #e6e6e6',
                      borderRadius: 14,
                      cursor: 'pointer',
                      background: repairMethod === 'reference' ? '#f6ffed' : '#fff',
                      marginBottom: 14,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ 
                        width: 48, height: 48, 
                        borderRadius: 10, 
                        background: repairMethod === 'reference' ? '#52c41a' : '#f0f0f0', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: repairMethod === 'reference' ? '#fff' : '#888',
                        fontSize: 22
                      }}>
                        <FileTextOutlined />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 15 }}>Dùng file tham chiếu</Text>
                          <Tag color="green" style={{ fontSize: 11, padding: '0 6px' }}>Đã có</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 13 }}>Tái tạo cực kỳ chính xác từ video cùng camera</Text>
                      </div>
                      <Tag color="cyan" style={{ background: 'rgba(19,194,194,0.1)', border: 'none', color: '#13c2c2' }}>
                        Cao cấp
                      </Tag>
                    </div>
                  </div>
                )}

                {/* Two main AI options - side by side modern cards */}
                <div style={{ display: 'flex', gap: 14 }}>
                  {/* Basic */}
                  <div
                    onClick={() => setRepairMethod('auto_basic')}
                    style={{
                      flex: 1,
                      padding: '18px 16px',
                      borderRadius: 14,
                      cursor: 'pointer',
                      border: repairMethod === 'auto_basic' ? '2px solid #1677ff' : '1px solid #e6e6e6',
                      background: repairMethod === 'auto_basic' ? '#f0f7ff' : '#fff',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
                      <Text strong style={{ fontSize: 15, display: 'block' }}>Sửa nhanh (Cơ bản)</Text>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', margin: '6px 0 12px', minHeight: 32 }}>
                        Sửa lỗi header, index, metadata. Nhanh và tiết kiệm.
                      </Text>
                      <Tag color="blue" style={{ border: 'none', background: 'rgba(22,119,255,0.1)', color: '#1677ff' }}>
                        Tiết kiệm Point
                      </Tag>
                    </div>
                  </div>

                  {/* Advanced AI */}
                  <div
                    onClick={() => setRepairMethod('auto_ai')}
                    style={{
                      flex: 1,
                      padding: '18px 16px',
                      borderRadius: 14,
                      cursor: 'pointer',
                      border: repairMethod === 'auto_ai' ? '2px solid #722ed1' : '1px solid #e6e6e6',
                      background: repairMethod === 'auto_ai' ? '#f9f0ff' : '#fff',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {analysis.recommended_mode === 'deep' && (
                      <div style={{ 
                        position: 'absolute', 
                        top: -1, 
                        right: -1, 
                        background: '#722ed1', 
                        color: '#fff', 
                        fontSize: 11, 
                        padding: '2px 9px', 
                        borderRadius: '0 13px 0 8px',
                        fontWeight: 600
                      }}>
                        Đề xuất AI
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
                      <Text strong style={{ fontSize: 15, display: 'block' }}>Sửa sâu (AI)</Text>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', margin: '6px 0 12px', minHeight: 32 }}>
                        Khôi phục frame, âm thanh, đồng bộ bằng AI mạnh.
                      </Text>
                      <Tag color="purple" style={{ border: 'none', background: 'rgba(114,46,209,0.1)', color: '#722ed1' }}>
                        Chất lượng cao
                      </Tag>
                    </div>
                  </div>
                </div>

                {/* Big CTA */}
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  icon={<StepForwardOutlined />} 
                  onClick={handleRepair} 
                  loading={processing}
                  style={{ 
                    marginTop: 22, 
                    height: 52, 
                    borderRadius: 12, 
                    fontSize: 16, 
                    fontWeight: 500,
                    background: 'linear-gradient(90deg, #1677ff, #4f46e5)', 
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(22, 119, 255, 0.3)'
                  }}
                >
                  Bắt đầu khôi phục video
                </Button>

                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <Button type="link" size="small" onClick={() => setStep(0)}>
                    ← Quay lại chọn file khác
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Step 2: Processing - Premium loader */}
      {step === 2 && processing && (
        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 22, 
            padding: '52px 42px', 
            boxShadow: '0 16px 48px rgba(0,0,0,0.07)', 
            maxWidth: 560, 
            margin: '0 auto',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
              <Spin size="large" style={{ transform: 'scale(1.8)' }} />
            </div>
            
            <Title level={4} style={{ marginBottom: 10, color: '#1677ff', fontWeight: 600 }}>AI đang khôi phục video của bạn</Title>
            
            <div style={{ 
              background: '#f0f7ff', 
              padding: '14px 22px', 
              borderRadius: 10, 
              display: 'inline-block', 
              minWidth: 280,
              marginBottom: 20
            }}>
              <Text strong style={{ fontSize: 15, color: '#0958d9' }}>
                {loadingPhrases[loadingPhraseIndex]}
              </Text>
            </div>
            
            <Text type="secondary" style={{ fontSize: 14 }}>
              Quá trình có thể mất từ 30 giây đến vài phút. <br />Vui lòng giữ trình duyệt mở.
            </Text>
          </div>
        </div>
      )}

      {/* Step 3: Result - Beautiful success state */}
      {step === 3 && job && job.status === 'completed' && job.result && (
        <div style={{ animation: 'fadeIn 0.8s', textAlign: 'center' }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 22, 
            padding: '48px 42px', 
            boxShadow: '0 16px 50px rgba(0,0,0,0.06)', 
            maxWidth: 680, 
            margin: '0 auto',
            border: '1px solid #b7eb8f'
          }}>
            <div style={{ fontSize: 72, color: '#52c41a', marginBottom: 16 }}>
              <CheckCircleOutlined />
            </div>
            <Title level={2} style={{ marginBottom: 6 }}>Khôi phục thành công!</Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Video đã được tái tạo hoàn chỉnh trong {job.result.duration_seconds || 0} giây.
            </Text>

            <div style={{ 
              background: '#fafafa', 
              borderRadius: 14, 
              padding: 22, 
              textAlign: 'left', 
              margin: '28px 0 36px' 
            }}>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Cấu hình đã dùng</Text>
                  <ul style={{ paddingLeft: 18, margin: '8px 0 0', fontSize: 14, lineHeight: 1.7 }}>
                    <li><Text strong>Chế độ:</Text> {job.result.repair_mode}</li>
                    <li><Text strong>Codec:</Text> {job.result.codec}</li>
                    <li><Text strong>Âm thanh:</Text> {job.result.audio_preserved ? 'Đã giữ nguyên' : 'Đã loại bỏ'}</li>
                  </ul>
                </Col>
                <Col xs={24} md={12}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Kết quả</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="success" style={{ padding: '5px 11px', fontSize: 13, borderRadius: 6 }}>
                      Đã sửa {job.result.fixed_count || 0}/{job.result.error_count || 0} lỗi
                    </Tag>
                  </div>
                  {job.result.errors_fixed && job.result.errors_fixed.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#555' }}>
                      {job.result.errors_fixed.slice(0, 2).map((err: string, i: number) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </Col>
              </Row>
            </div>

            <Space size="middle">
              <Button 
                type="primary" 
                size="large" 
                icon={<DownloadOutlined />} 
                style={{ 
                  height: 50, 
                  padding: '0 36px', 
                  borderRadius: 11, 
                  fontSize: 15,
                  background: '#52c41a',
                  border: 'none'
                }}
              >
                Tải video đã khôi phục
              </Button>
              <Button 
                size="large" 
                onClick={handleReset} 
                style={{ height: 50, padding: '0 32px', borderRadius: 11, fontSize: 15 }}
              >
                Sửa video khác
              </Button>
            </Space>
          </div>
        </div>
      )}

      {step === 3 && job && job.status === 'failed' && (
        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 20, 
            padding: '42px 36px', 
            maxWidth: 520, 
            margin: '0 auto',
            boxShadow: '0 10px 36px rgba(0,0,0,0.05)'
          }}>
            <Result
              status="error"
              title="Khôi phục thất bại"
              subTitle={job.error || 'Video bị hỏng quá nặng hoặc định dạng không hỗ trợ.'}
              extra={[
                <Button key="retry" type="primary" size="large" onClick={handleRepair} style={{ borderRadius: 10 }}>
                  Thử lại bằng AI Nâng cao
                </Button>,
                <Button key="reset" size="large" onClick={handleReset} style={{ borderRadius: 10 }}>
                  Chọn video khác
                </Button>,
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRepairPage;
