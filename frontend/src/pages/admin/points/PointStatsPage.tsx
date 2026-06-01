import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Typography } from 'antd';
const { Title } = Typography;
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined } from '@ant-design/icons';
import { pointsApi } from '../../../api/points';
import type { PointStats } from '../../../api/points';

const serviceLabels: Record<string, string> = {
  license_plate_image: 'Biển số (ảnh)',
  license_plate_video: 'Biển số (video)',
  video_repair_fast: 'Sửa video nhanh',
  video_repair_deep: 'Sửa video sâu',
};

const PointStatsPage: React.FC = () => {
  const [stats, setStats] = useState<PointStats | null>(null);

  useEffect(() => {
    pointsApi.stats().then((res) => setStats(res.data.data)).catch(() => {});
  }, []);

  const byServiceData = stats?.by_service
    ? Object.entries(stats.by_service).map(([key, val]) => ({
        key,
        service: serviceLabels[key] || key,
        points: val,
      }))
    : [];

  return (
    <Card title="Thống kê Point">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Tổng cấp phát" value={stats?.total_issued || 0} prefix={<ArrowUpOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Tổng tiêu thụ" value={stats?.total_consumed || 0} prefix={<ArrowDownOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Còn lưu hành" value={stats?.total_circulating || 0} prefix={<DollarOutlined />} />
          </Card>
        </Col>
      </Row>

      <Title level={5}>Phân bổ theo module</Title>
      <Table
        dataSource={byServiceData}
        columns={[
          { title: 'Dịch vụ', dataIndex: 'service', key: 'service' },
          { title: 'Point tiêu thụ', dataIndex: 'points', key: 'points' },
        ]}
        rowKey="key"
        pagination={{ pageSize: 10, showTotal: (t) => `Tổng: ${t}` }}
      />
    </Card>
  );
};

export default PointStatsPage;
