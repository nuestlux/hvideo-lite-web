import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Tag, Typography, message, Steps, Space, Divider, Alert, Progress, Radio, Descriptions, Result, Collapse } from 'antd';
const { Text, Title } = Typography;
import { UploadOutlined, BugOutlined, CheckCircleOutlined, RobotOutlined, FileTextOutlined, DownloadOutlined, StepForwardOutlined } from '@ant-design/icons';
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

const VideoRepairPage: React.FC = () => {
  const [step, setStep] = useState(0);

  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFileId, setMainFileId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const [refFile, setRefFile] = useState<File | null>(null);
  const [refFileId, setRefFileId] = useState<number | null>(null);
  const [refUploading, setRefUploading] = useState(false);

  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const [repairMethod, setRepairMethod] = useState<string>('ai');

  const [job, setJob] = useState<Job | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

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
    const prog = setInterval(() => setAnalysisProgress(p => Math.min(p + 10, 90)), 400);
    try {
      const res = await aiApi.analyzeVideo(mainFileId);
      setAnalysis(res.data.data);
      setAnalysisProgress(100);
      clearInterval(prog);
      setStep(1);
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
    setJob(null);
    try {
      const config = {
        codec: 'H.264',
        repair_level: 3,
        keep_audio: true,
        repair_method: repairMethod,
        reference_file_id: (repairMethod === 'reference' || repairMethod === 'both') ? refFileId : null,
      };
      const module = analysis?.recommended_mode === 'deep' ? 'video_repair_deep' : 'video_repair_fast';
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
    setAnalysis(null); setJob(null); setAnalysisProgress(0); setRepairMethod('ai');
  };

  const steps = [
    { title: 'Upload', icon: <UploadOutlined /> },
    { title: 'Chẩn đoán', icon: <BugOutlined /> },
    { title: 'Sửa chữa', icon: <RobotOutlined /> },
    { title: 'Kết quả', icon: <CheckCircleOutlined /> },
  ];

  return (
    <>
      <Title level={4}>Sửa chữa video hỏng</Title>
      <Steps current={step} items={steps} style={{ marginBottom: 24 }} />

      {/* Step 0: Upload */}
      {step === 0 && (
        <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 700, margin: '0 auto', display: 'block' }}>
          <Card title={<><UploadOutlined /> Video cần sửa</>}>
            <Upload accept="video/*" showUploadList={false} beforeUpload={handleUploadMain}>
              <Button icon={<UploadOutlined />} loading={uploading} size="large">Chọn video hỏng</Button>
            </Upload>
            {mainFile && (
              <div style={{ marginTop: 12 }}>
                <video controls style={{ maxWidth: '100%', maxHeight: 240 }}>
                  <source src={URL.createObjectURL(mainFile)} />
                </video>
                <Text style={{ display: 'block', marginTop: 4 }}>{mainFile.name} ({(mainFile.size / 1024 / 1024).toFixed(1)} MB)</Text>
              </div>
            )}
          </Card>

          <Card title={<><FileTextOutlined /> File mẫu tham chiếu (không bắt buộc)</>}
            extra={<Text type="secondary">Video cùng format để tham chiếu</Text>}>
            <Upload accept="video/*" showUploadList={false} beforeUpload={handleUploadRef}>
              <Button icon={<UploadOutlined />} loading={refUploading}>Chọn file mẫu</Button>
            </Upload>
            {refFile && (
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{refFile.name}</Tag>
                <Button size="small" type="link" danger onClick={() => { setRefFile(null); setRefFileId(null); }}>Bỏ</Button>
              </div>
            )}
          </Card>

          <div style={{ textAlign: 'center' }}>
            <Button type="primary" icon={<BugOutlined />} size="large" onClick={handleAnalyze}
              loading={analyzing} disabled={!mainFileId} style={{ minWidth: 200 }}>
              {analyzing ? 'Đang phân tích...' : 'Phân tích lỗi'}
            </Button>
          </div>
          {analyzing && <Progress percent={analysisProgress} status="active" />}
        </Space>
      )}

      {/* Step 1: Diagnosis */}
      {step === 1 && analysis && (
        <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 700, margin: '0 auto', display: 'block' }}>
          <Card title={<><BugOutlined /> Kết quả chẩn đoán</>}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Tên file">{analysis.file_name}</Descriptions.Item>
              <Descriptions.Item label="Kích thước">{(analysis.file_size / 1024 / 1024).toFixed(1)} MB</Descriptions.Item>
              <Descriptions.Item label="Có thể sửa">
                {analysis.repairable ? <Tag color="green">Có</Tag> : <Tag color="red">Không</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Khuyến nghị">
                <Tag color={analysis.recommended_mode === 'deep' ? 'orange' : 'blue'}>
                  {analysis.recommended_mode === 'deep' ? 'Sửa sâu' : 'Sửa nhanh'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Text strong>Lỗi phát hiện ({analysis.errors.length} lỗi):</Text>
            <div style={{ marginTop: 8 }}>
              {analysis.errors.map((err, i) => (
                <Alert
                  key={i}
                  type={err.severity === 'critical' ? 'error' : err.severity === 'high' ? 'warning' : 'info'}
                  message={errorLabels[err.type] || err.type}
                  description={err.description}
                  style={{ marginBottom: 8 }} showIcon
                />
              ))}
            </div>
            {analysis.has_critical_errors && (
              <Alert type="warning" message="Có lỗi nghiêm trọng — nên dùng file mẫu để tăng tỉ lệ thành công" showIcon style={{ marginTop: 8 }} />
            )}
          </Card>

          <Alert
            type={analysis.recommended_mode === 'deep' ? 'warning' : 'info'}
            showIcon
            style={{ marginBottom: 12, borderRadius: 8 }}
            message={
              <Space wrap>
                <Text strong>
                  Gợi ý: {analysis.recommended_mode === 'deep' ? 'Sửa sâu' : 'Sửa nhanh'}
                </Text>
                <Tag color={analysis.recommended_mode === 'deep' ? 'orange' : 'blue'}>
                  Đề xuất
                </Tag>
              </Space>
            }
            description="Bạn có thể mở phần bên dưới để tự chọn phương thức sửa khác nếu cần."
          />

          <Collapse
            defaultActiveKey={["repair-method"]}
            items={[
              {
                key: 'repair-method',
                label: <><RobotOutlined /> Chọn phương thức sửa</>,
                children: (
                  <Radio.Group value={repairMethod} onChange={e => setRepairMethod(e.target.value)} style={{ width: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Radio
                        value="ai"
                        style={{
                          padding: 12,
                          border: repairMethod === 'ai' ? '1px solid #1677ff' : '1px solid #d9d9d9',
                          borderRadius: 8,
                          width: '100%',
                          background: analysis.recommended_mode === 'fast' ? '#f0f7ff' : '#fff',
                        }}
                      >
                        <Space>
                          <RobotOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                          <div>
                            <Space wrap size={6}>
                              <Text strong>Sửa bằng AI</Text>
                              {analysis.recommended_mode === 'fast' && <Tag color="blue">Đề xuất</Tag>}
                            </Space>
                            <br /><Text type="secondary">Hệ thống tự động phân tích và sửa lỗi. Không cần file mẫu.</Text>
                          </div>
                        </Space>
                      </Radio>
                      <Radio
                        value="reference"
                        style={{
                          padding: 12,
                          border: repairMethod === 'reference' ? '1px solid #1677ff' : '1px solid #d9d9d9',
                          borderRadius: 8,
                          width: '100%',
                          background: analysis.recommended_mode === 'reference' ? '#f6ffed' : '#fff',
                        }}
                        disabled={!refFile}
                      >
                        <Space>
                          <FileTextOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                          <div>
                            <Space wrap size={6}>
                              <Text strong>Sửa theo file mẫu</Text>
                              {refFile && <Tag color="green">Có file mẫu</Tag>}
                            </Space>
                            <br /><Text type="secondary">Dùng video tham chiếu để đồng bộ codec, resolution, frame rate.</Text>
                          </div>
                        </Space>
                      </Radio>
                      <Radio
                        value="both"
                        style={{
                          padding: 12,
                          border: repairMethod === 'both' ? '1px solid #1677ff' : '1px solid #d9d9d9',
                          borderRadius: 8,
                          width: '100%',
                          background: analysis.has_critical_errors ? '#fff7e6' : '#fff',
                        }}
                        disabled={!refFile}
                      >
                        <Space>
                          <span style={{ fontSize: 20 }}>🔀</span>
                          <div>
                            <Space wrap size={6}>
                              <Text strong>Cả hai (AI + File mẫu)</Text>
                              {analysis.has_critical_errors && <Tag color="gold">Khuyến nghị khi lỗi nặng</Tag>}
                            </Space>
                            <br /><Text type="secondary">AI sửa trước, sau đó dùng file mẫu để fine-tune chất lượng cao nhất.</Text>
                          </div>
                        </Space>
                      </Radio>
                    </Space>
                  </Radio.Group>
                ),
              },
            ]}
            style={{ marginBottom: 12 }}
          />

          <div style={{ textAlign: 'center' }}>
            <Button type="primary" icon={<StepForwardOutlined />} size="large"
              loading={processing} onClick={handleRepair} disabled={!mainFileId} style={{ minWidth: 200 }}>
              {processing ? 'Đang sửa...' : 'Bắt đầu sửa chữa'}
            </Button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button onClick={() => setStep(0)}>Quay lại upload</Button>
          </div>
        </Space>
      )}

      {/* Step 2: Processing */}
      {step === 2 && job && (job.status === 'pending' || job.status === 'processing') && (
        <Card title="Đang xử lý..." style={{ textAlign: 'center', padding: 24, maxWidth: 500, margin: '0 auto' }}>
          <Progress type="circle" percent={50} status="active" />
          <Steps
            direction="vertical"
            current={1}
            style={{ marginTop: 24, maxWidth: 400, margin: '24px auto' }}
            items={[
              { title: 'Đọc cấu trúc file', status: 'finish' },
              { title: 'Phân tích lỗi', status: 'process' },
              { title: 'Sửa chữa', status: 'wait' },
              { title: 'Xác thực', status: 'wait' },
            ]}
          />
        </Card>
      )}

      {/* Step 3: Result */}
      {step === 3 && job && job.status === 'completed' && job.result && (
        <Result
          status="success"
          title="Sửa video thành công!"
          subTitle={`Xử lý xong trong ${job.result.duration_seconds || 0} giây${job.result.has_reference ? ' (với file mẫu)' : ''}`}
          extra={[
            <Button key="download" type="primary" icon={<DownloadOutlined />}>Tải video đã sửa</Button>,
            <Button key="reset" onClick={handleReset}>Sửa video khác</Button>,
          ]}
        >
          <Card title="Chi tiết kết quả">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Phương thức">
                <Tag color="blue">{job.result.repair_method === 'ai' ? 'AI' : job.result.repair_method === 'reference' ? 'File mẫu' : 'AI + File mẫu'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Chế độ">{job.result.repair_mode}</Descriptions.Item>
              <Descriptions.Item label="Codec">{job.result.codec}</Descriptions.Item>
              <Descriptions.Item label="Giữ audio">{job.result.audio_preserved ? 'Có' : 'Không'}</Descriptions.Item>
            </Descriptions>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Lỗi tìm thấy ({job.result.error_count || 0}):</Text><br />
                {(job.result.errors_found || []).map((e: string, i: number) => (
                  <Tag key={i} color="orange" style={{ marginTop: 4 }}>{e}</Tag>
                ))}
              </div>
              <div>
                <Text strong>Lỗi đã sửa ({job.result.fixed_count || 0}):</Text><br />
                {(job.result.errors_fixed || []).map((e: string, i: number) => (
                  <Tag key={i} color="green" style={{ marginTop: 4 }}><CheckCircleOutlined /> {e}</Tag>
                ))}
              </div>
            </Space>
          </Card>
        </Result>
      )}

      {step === 3 && job && job.status === 'failed' && (
        <Result
          status="error"
          title="Sửa video thất bại"
          subTitle={job.error || 'Không thể phục hồi video'}
          extra={[
            <Button key="retry" type="primary" onClick={handleRepair}>Thử lại</Button>,
            <Button key="reset" onClick={handleReset}>Sửa video khác</Button>,
          ]}
        />
      )}
    </>
  );
};

export default VideoRepairPage;
