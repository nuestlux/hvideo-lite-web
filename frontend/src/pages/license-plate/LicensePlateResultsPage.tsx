import React, { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Space, Spin, Steps, Result, Divider } from 'antd';
const { Text, Title } = Typography;
import { useLocation, useNavigate } from 'react-router-dom';
import { aiApi } from '../../api/ai';
import type { Job, BatchProcessResult } from '../../api/ai';

const COUNTRY_FLAGS: Record<string, string> = {
  VN: '🇻🇳', US: '🇺🇸', JP: '🇯🇵', KR: '🇰🇷',
};

const LicensePlateResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.fileId) {
      navigate('/license-plate', { replace: true });
      return;
    }
    startProcessing();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startProcessing = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        countries: state.countries,
        vehicle_type: state.vehicleType,
        plate_color: state.plateColor,
        adjustments: state.adjustments,
      };
      const res = await aiApi.process('license_plate_image', state.fileId, config);
      const data = res.data.data as BatchProcessResult;
      if (data.batch_id) {
        setJobs(data.jobs);
        startPolling(data.batch_id);
      } else {
        const singleJob = data as unknown as Job;
        setJobs([singleJob]);
        if (singleJob.status === 'pending' || singleJob.status === 'processing') {
          pollSingleJob(singleJob.id);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Khởi tạo xử lý thất bại';
      setError(msg);
      setLoading(false);
    }
  };

  const startPolling = (bId: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await aiApi.getBatchJobs(bId);
        const updated = res.data.data;
        setJobs(updated);
        const allDone = updated.every(j => j.status === 'completed' || j.status === 'failed');
        if (allDone) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setLoading(false);
        }
      } catch {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setLoading(false);
      }
    }, 2000);
  };

  const pollSingleJob = (jobId: number) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await aiApi.getJob(jobId);
        const job = res.data.data;
        setJobs([job]);
        if (job.status === 'completed' || job.status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setLoading(false);
        }
      } catch {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setLoading(false);
      }
    }, 2000);
  };

  const handleBack = () => {
    navigate('/license-plate');
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'green';
    if (conf >= 60) return 'orange';
    return 'red';
  };

  if (error) {
    return (
      <Result
        status="error"
        title="Xử lý thất bại"
        subTitle={error}
        extra={[
          <Button key="back" type="primary" onClick={handleBack}>Quay lại chỉnh sửa</Button>,
          <Button key="retry" onClick={startProcessing}>Thử lại</Button>,
        ]}
      />
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Kết quả xử lý biển số</Title>
        <Space>
          <Button onClick={handleBack}>← Quay lại chỉnh sửa</Button>
        </Space>
      </div>

      {loading && jobs.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <Spin />
            <Text>Đang xử lý {jobs.filter(j => j.status === 'completed' || j.status === 'failed').length}/{jobs.length} model...</Text>
          </Space>
          {jobs.map(job => (
            <div key={job.id} style={{ marginTop: 8 }}>
              <Text strong>{COUNTRY_FLAGS[job.country || ''] || ''} {job.country || 'Unknown'}: </Text>
              <Tag color={job.status === 'completed' ? 'green' : job.status === 'failed' ? 'red' : 'processing'}>
                {job.status === 'pending' ? 'Chờ xử lý' : job.status === 'processing' ? 'Đang xử lý' : job.status === 'completed' ? 'Hoàn thành' : 'Thất bại'}
              </Tag>
            </div>
          ))}
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {jobs.map(job => {
          const result = job.result;
          const conf = result?.confidence || (job.confidence ? parseFloat(job.confidence) : 0);
          return (
            <Col xs={24} sm={12} lg={8} key={job.id}>
              <Card
                style={{
                  borderColor: job.status === 'completed' ? '#52c41a' : job.status === 'failed' ? '#ff4d4f' : '#d9d9d9',
                }}
              >
                {job.status === 'processing' || job.status === 'pending' ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Spin />
                    <div style={{ marginTop: 8 }}>
                      <Text strong>{COUNTRY_FLAGS[job.country || ''] || ''} {job.country || 'Unknown'}</Text>
                    </div>
                    <Steps
                      direction="vertical"
                      size="small"
                      style={{ marginTop: 12 }}
                      current={1}
                      items={[
                        { title: 'Tăng cường ảnh', status: 'process' },
                        { title: 'Phát hiện biển số', status: 'wait' },
                        { title: 'Nhận dạng ký tự', status: 'wait' },
                        { title: 'Xác thực kết quả', status: 'wait' },
                      ]}
                    />
                  </div>
                ) : job.status === 'completed' && result ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text strong>
                        {COUNTRY_FLAGS[result.country || job.country || ''] || ''} {result.country || job.country || 'Unknown'}
                      </Text>
                      <Tag color={getConfidenceColor(conf)}>{conf}%</Tag>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                      {result.original_crop_url && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Biển số gốc (Crop)</Text>
                          <img src={result.original_crop_url} alt="Original Plate" style={{ width: '100%', height: 60, objectFit: 'contain', background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: 4 }} />
                        </div>
                      )}
                      
                      {result.enhanced_url && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Sau khi khôi phục (AI)</Text>
                          <img src={result.enhanced_url} alt="Enhanced Plate" style={{ width: '100%', height: 60, objectFit: 'contain', background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: 4 }} />
                        </div>
                      )}
                    </div>

                    <Title level={3} style={{ margin: '0 0 4px 0', color: '#1890ff', letterSpacing: 2, fontFamily: 'monospace', textAlign: 'center' }}>
                      {result.plate || 'N/A'}
                    </Title>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <Text type="secondary">
                        {result.vehicle_type === 'car' ? 'Ô tô' : result.vehicle_type === 'motorcycle' ? 'Xe máy' : 'Xe tải'}
                        {' • '}
                        {result.plate_color === 'white' ? 'Trắng' : result.plate_color === 'black' ? 'Đen' : result.plate_color === 'yellow' ? 'Vàng' : 'Xanh'}
                      </Text>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />
                    <Space style={{ display: 'flex', justifyContent: 'center' }}>
                      <Button type="primary" size="small">Chọn kết quả</Button>
                      <Button size="small">Tải xuống</Button>
                    </Space>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong>{COUNTRY_FLAGS[job.country || ''] || ''} {job.country || 'Unknown'}</Text>
                      <Tag color="red">Thất bại</Tag>
                    </div>
                    <Text type="danger">{job.error || 'Xử lý thất bại'}</Text>
                  </>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {!loading && jobs.length === 0 && !error && (
        <Card>
          <Result
            status="info"
            title="Đang khởi tạo..."
            subTitle="Vui lòng đợi trong giây lát"
          />
        </Card>
      )}
    </>
  );
};

export default LicensePlateResultsPage;
