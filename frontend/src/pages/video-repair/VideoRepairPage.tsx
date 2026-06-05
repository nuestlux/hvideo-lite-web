import React, { useState, useEffect } from 'react';
import { Upload, Button, Tag, Typography, message, Steps, Space, Divider, Progress, Result, Row, Col, Spin } from 'antd';
const { Text, Title, Paragraph } = Typography;
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
    } catch { message.error('Phân tích thất bại'); clearInterval(prog); } finally { setAnalyzing(false); }
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
    <div style={{ padding: '0 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2} style={{ marginBottom: 8 }}>Trợ lý Phục hồi Video AI</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>Khôi phục video bị hỏng file, mất frame hoặc không thể mở bằng công nghệ AI tiên tiến</Text>
      </div>

      <Steps current={step} items={steps} style={{ marginBottom: 40 }} />

      {/* Step 0: Upload */}
      {step === 0 && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          {!mainFile ? (
            <div style={{ 
              background: '#fff', padding: 40, borderRadius: 24, 
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)', textAlign: 'center' 
            }}>
              <Dragger 
                accept="video/*" 
                showUploadList={false} 
                beforeUpload={handleUploadMain}
                style={{ background: '#f8fafd', border: '2px dashed #1677ff', borderRadius: 16, padding: '40px 0' }}
              >
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined style={{ fontSize: 64, color: '#1677ff' }} />
                </p>
                <Title level={4} style={{ marginTop: 16 }}>Kéo thả video hỏng vào đây</Title>
                <Text type="secondary">Hoặc click để chọn file từ máy tính</Text>
                <div style={{ marginTop: 16 }}>
                  <Tag>MP4</Tag><Tag>MOV</Tag><Tag>AVI</Tag>
                  <Divider type="vertical" />
                  <Text type="secondary">Tối đa 500MB</Text>
                </div>
              </Dragger>
            </div>
          ) : (
            <div style={{ 
              background: '#fff', padding: 24, borderRadius: 24, 
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)'
            }}>
              <Row gutter={24} align="middle">
                <Col span={8}>
                  <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <VideoCameraOutlined style={{ fontSize: 48, color: '#444' }} />
                  </div>
                </Col>
                <Col span={16}>
                  <Title level={4} style={{ margin: 0, color: '#1677ff' }}>{mainFile.name}</Title>
                  <Text type="secondary">{(mainFile.size / 1024 / 1024).toFixed(1)} MB</Text>
                  
                  <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <Button 
                      type="primary" size="large" icon={<BugOutlined />} 
                      onClick={handleAnalyze} loading={analyzing} 
                      style={{ borderRadius: 8, height: 48, padding: '0 32px' }}
                    >
                      Bắt đầu chẩn đoán lỗi
                    </Button>
                    <Button size="large" onClick={() => setMainFile(null)} style={{ borderRadius: 8, height: 48 }}>
                      Đổi video
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {analyzing && (
            <div style={{ marginTop: 24, background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>AI đang quét lỗi video...</Text>
                <Text type="secondary">{analysisProgress}%</Text>
              </div>
              <Progress percent={analysisProgress} status="active" showInfo={false} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            {!showRefUpload ? (
              <Button type="dashed" block onClick={() => setShowRefUpload(true)} style={{ height: 48, borderRadius: 12 }}>
                Bạn có video quay cùng camera không bị lỗi? (Tuỳ chọn thêm file tham chiếu)
              </Button>
            ) : (
              <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}><FileTextOutlined /> File mẫu tham chiếu</Text>
                    <br/><Text type="secondary">Giúp tăng tỉ lệ khôi phục thành công lên đến 99%</Text>
                  </div>
                  <Button type="text" onClick={() => setShowRefUpload(false)}>Đóng</Button>
                </div>
                {!refFile ? (
                   <Dragger 
                    accept="video/*" showUploadList={false} beforeUpload={handleUploadRef}
                    style={{ background: '#fff', borderRadius: 8 }}
                   >
                    <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#1677ff' }} /></p>
                    <p className="ant-upload-text">Kéo thả file mẫu hoặc click để tải lên</p>
                  </Dragger>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #d9d9d9' }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ color: '#52c41a' }}><CheckCircleOutlined /> Đã tải lên:</Text> {refFile.name}
                    </div>
                    <Button danger onClick={() => { setRefFile(null); setRefFileId(null); }}>Gỡ bỏ</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Diagnosis & Select Method */}
      {step === 1 && analysis && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <Row gutter={24}>
            {/* Cột trái: Báo cáo */}
            <Col span={10}>
              <div style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, background: '#fff1f0', color: '#f5222d', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    <BugOutlined />
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>Báo cáo chẩn đoán</Title>
                    <Text type="secondary">Phân tích cấu trúc video</Text>
                  </div>
                </div>

                <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                   <Row gutter={[0, 16]}>
                     <Col span={12}><Text type="secondary">Trạng thái:</Text></Col>
                     <Col span={12} style={{ textAlign: 'right' }}>
                       {analysis.repairable ? <Tag color="success" style={{ margin: 0 }}>Khả thi</Tag> : <Tag color="error" style={{ margin: 0 }}>Rất khó</Tag>}
                     </Col>
                     <Col span={12}><Text type="secondary">Dung lượng:</Text></Col>
                     <Col span={12} style={{ textAlign: 'right' }}><Text strong>{(analysis.file_size / 1024 / 1024).toFixed(1)} MB</Text></Col>
                   </Row>
                </div>

                <Text strong>Lỗi phát hiện ({analysis.errors.length}):</Text>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {analysis.errors.map((err, i) => (
                     <Tag 
                       key={i} 
                       color={err.severity === 'critical' ? 'error' : 'warning'} 
                       style={{ padding: '4px 10px', borderRadius: 6, fontSize: 13 }}
                     >
                       {errorLabels[err.type] || err.type}
                     </Tag>
                  ))}
                </div>
              </div>
            </Col>

            {/* Cột phải: Chọn phương pháp */}
            <Col span={14}>
              <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                <Title level={4} style={{ marginBottom: 24 }}>Chọn phương thức sửa chữa</Title>

                {/* Nhánh A: File tham chiếu */}
                <div
                  onClick={() => { if (refFile) setRepairMethod('reference'); }}
                  style={{
                    padding: 20,
                    border: repairMethod === 'reference' ? '2px solid #52c41a' : '2px solid transparent',
                    borderRadius: 16,
                    cursor: refFile ? 'pointer' : 'not-allowed',
                    opacity: refFile ? 1 : 0.6,
                    background: repairMethod === 'reference' ? '#f6ffed' : '#f5f5f5',
                    transition: 'all 0.2s',
                    marginBottom: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: repairMethod === 'reference' ? '#52c41a' : '#d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff' }}>
                      <FileTextOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 16 }}>Sửa bằng File tham chiếu</Text>
                        {refFile ? <Tag color="green">Đã tải lên</Tag> : <Tag>Chưa có</Tag>}
                      </div>
                      <Text type="secondary">Tái tạo cấu trúc dựa trên video quay cùng thiết bị</Text>
                    </div>
                    <Tag color="cyan" style={{ border: 'none', background: 'rgba(19,194,194,0.1)', color: '#13c2c2', fontWeight: 600 }}>Tốn Point riêng</Tag>
                  </div>
                </div>

                <Divider plain><Text type="secondary" style={{ fontSize: 12 }}>HOẶC DÙNG AI TỰ ĐỘNG</Text></Divider>

                {/* Nhánh B: Tự động */}
                <div style={{ display: 'flex', gap: 16 }}>
                  {/* Basic */}
                  <div
                    onClick={() => setRepairMethod('auto_basic')}
                    style={{
                      flex: 1, padding: 24, borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                      border: repairMethod === 'auto_basic' ? '2px solid #1677ff' : '2px solid transparent',
                      background: repairMethod === 'auto_basic' ? '#e6f4ff' : '#f5f5f5',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>Sửa Cơ Bản</Text>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16, height: 40 }}>Xử lý lỗi meta, index nhanh chóng</Text>
                    <Tag color="blue" style={{ border: 'none', background: 'rgba(22,119,255,0.1)', color: '#1677ff', fontWeight: 600 }}>Ít Point</Tag>
                  </div>

                  {/* AI Advanced */}
                  <div
                    onClick={() => setRepairMethod('auto_ai')}
                    style={{
                      flex: 1, padding: 24, borderRadius: 16, cursor: 'pointer', textAlign: 'center', position: 'relative',
                      border: repairMethod === 'auto_ai' ? '2px solid #722ed1' : '2px solid transparent',
                      background: repairMethod === 'auto_ai' ? '#f9f0ff' : '#f5f5f5',
                      transition: 'all 0.2s',
                    }}
                  >
                    {analysis.recommended_mode === 'deep' && (
                      <div style={{ position: 'absolute', top: 0, right: 0, background: '#722ed1', color: '#fff', padding: '4px 12px', borderRadius: '0 14px 0 12px', fontSize: 12, fontWeight: 600 }}>Đề xuất</div>
                    )}
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>Sửa Nâng Cao (AI)</Text>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16, height: 40 }}>Phân tích sâu, khôi phục frame & audio</Text>
                    <Tag color="purple" style={{ border: 'none', background: 'rgba(114,46,209,0.1)', color: '#722ed1', fontWeight: 600 }}>Nhiều Point</Tag>
                  </div>
                </div>

                <Button 
                  type="primary" size="large" block 
                  icon={<StepForwardOutlined />} 
                  onClick={handleRepair} 
                  loading={processing}
                  style={{ marginTop: 32, height: 56, borderRadius: 12, fontSize: 16, background: 'linear-gradient(90deg, #1677ff, #722ed1)', border: 'none' }}
                >
                  Bắt đầu tiến trình khôi phục
                </Button>
                
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                   <Button type="link" onClick={() => setStep(0)}>Quay lại tải file</Button>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && processing && (
        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
          <div style={{ 
            background: '#fff', borderRadius: 24, padding: '60px 40px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)', maxWidth: 600, margin: '0 auto' 
          }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 40 }}>
               <Spin size="large" style={{ transform: 'scale(2)' }} />
            </div>
            
            <Title level={3} style={{ marginBottom: 16, color: '#1677ff' }}>Hệ thống đang làm việc</Title>
            
            <div style={{ 
              background: '#f0f5ff', padding: '16px 24px', borderRadius: 12, 
              display: 'inline-block', minWidth: 300, transition: 'all 0.3s'
            }}>
              <Text strong style={{ fontSize: 16, color: '#0958d9' }}>
                {loadingPhrases[loadingPhraseIndex]}
              </Text>
            </div>
            
            <Paragraph type="secondary" style={{ marginTop: 24 }}>
              Vui lòng không đóng trình duyệt. Quá trình này có thể mất vài phút tùy thuộc vào dung lượng và mức độ hỏng của video.
            </Paragraph>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && job && job.status === 'completed' && job.result && (
        <div style={{ animation: 'fadeIn 0.8s', textAlign: 'center' }}>
          <div style={{ 
            background: 'linear-gradient(180deg, #f6ffed 0%, #ffffff 100%)', 
            borderRadius: 24, padding: '60px 40px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)', maxWidth: 700, margin: '0 auto',
            border: '1px solid #b7eb8f'
          }}>
            <div style={{ fontSize: 80, color: '#52c41a', marginBottom: 24, animation: 'bounce 1s ease' }}>
              <CheckCircleOutlined />
            </div>
            <Title level={2}>Khôi phục thành công!</Title>
            <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 32 }}>
              Video của bạn đã được tái tạo hoàn chỉnh trong {job.result.duration_seconds || 0} giây.
            </Text>

            <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f0f0f0', textAlign: 'left', marginBottom: 40 }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Text type="secondary">Cấu hình sửa chữa:</Text>
                  <ul style={{ paddingLeft: 20, margin: '12px 0 0 0' }}>
                    <li><Text strong>Chế độ:</Text> {job.result.repair_mode}</li>
                    <li><Text strong>Codec:</Text> {job.result.codec}</li>
                    <li><Text strong>Âm thanh:</Text> {job.result.audio_preserved ? 'Giữ nguyên' : 'Đã loại bỏ'}</li>
                  </ul>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Kết quả khôi phục:</Text>
                  <div style={{ marginTop: 12 }}>
                    <Tag color="success" style={{ padding: '6px 12px', fontSize: 14, borderRadius: 8 }}>
                      Đã khắc phục {job.result.fixed_count || 0} / {job.result.error_count || 0} lỗi
                    </Tag>
                  </div>
                  {job.result.errors_fixed && job.result.errors_fixed.length > 0 && (
                    <ul style={{ paddingLeft: 20, margin: '12px 0 0 0', fontSize: 13, color: '#555' }}>
                      {job.result.errors_fixed.slice(0, 3).map((err: string, i: number) => (
                         <li key={i}>{err}</li>
                      ))}
                      {job.result.errors_fixed.length > 3 && <li>...</li>}
                    </ul>
                  )}
                </Col>
              </Row>
            </div>

            <Space size="large">
              <Button type="primary" size="large" icon={<DownloadOutlined />} style={{ height: 56, padding: '0 40px', borderRadius: 12, fontSize: 16 }}>
                Tải Video (MP4)
              </Button>
              <Button size="large" onClick={handleReset} style={{ height: 56, padding: '0 40px', borderRadius: 12, fontSize: 16 }}>
                Sửa video khác
              </Button>
            </Space>
          </div>
        </div>
      )}

      {step === 3 && job && job.status === 'failed' && (
        <div style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
          <Result
            status="error"
            title="Khôi phục thất bại"
            subTitle={job.error || 'Video bị hỏng quá nặng, không thể khôi phục bằng phương thức hiện tại.'}
            extra={[
              <Button key="retry" type="primary" size="large" onClick={handleRepair}>Thử lại với AI Nâng cao</Button>,
              <Button key="reset" size="large" onClick={handleReset}>Chọn video khác</Button>,
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default VideoRepairPage;
