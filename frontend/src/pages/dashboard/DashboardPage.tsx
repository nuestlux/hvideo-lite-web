import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Typography } from 'antd';
const { Text } = Typography;
import { CheckCircleOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi } from '../../api/dashboard';
import type { AdminDashboard, OfficerDashboard, ServerHealth } from '../../api/dashboard';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const AdminDashboard: React.FC = () => {
  const [d, setD] = useState<AdminDashboard | null>(null);
  const [health, setHealth] = useState<ServerHealth | null>(null);

  useEffect(() => {
    dashboardApi.admin().then(r => setD(r.data.data)).catch(() => {});
    const fetchHealth = () => dashboardApi.serverHealth().then(r => setHealth(r.data.data)).catch(() => {});
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const maxVol = Math.max(...(d?.daily_volume.map(v => v.value) || [0]), 1);
  const maxIssued = Math.max(...(d?.weekly_issued.map(v => v.value) || [0]), 1);
  const maxConsumed = Math.max(...(d?.weekly_consumed.map(v => v.value) || [0]), 1);
  const maxW = Math.max(maxIssued, maxConsumed, 1);
  const maxRate = Math.max(...(d?.success_trend.map(v => v.rate) || [0]), 1);
  const moduleTotal = d?.by_module.reduce((s, m) => s + m.value, 0) || 1;

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Tổng cán bộ" value={d?.summary.total_users || 0} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Tổng lượt xử lý" value={d?.summary.total_jobs || 0} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Tỷ lệ thành công" value={d?.summary.success_rate || 0} suffix="%" prefix={<CheckCircleOutlined />} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Khối lượng xử lý theo ngày">
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 8 }}>
              {(d?.daily_volume || []).map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%', background: '#1890ff', borderRadius: '4px 4px 0 0',
                    height: `${(v.value / maxVol) * 170}px`, minHeight: v.value > 0 ? 4 : 0,
                    transition: 'height 0.5s',
                  }} />
                  <span style={{ fontSize: 11, marginTop: 4 }}>{v.value}</span>
                  <span style={{ fontSize: 10, color: '#888' }}>{v.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Xu hướng tỷ lệ thành công">
            <div style={{ position: 'relative', height: 200 }}>
              <svg viewBox="0 0 300 200" style={{ width: '100%', height: '100%' }}>
                {(d?.success_trend || []).map((v, i) => {
                  const x = 20 + (i / Math.max((d?.success_trend.length || 1) - 1, 1)) * 260;
                  const y = 180 - (v.rate / Math.max(maxRate, 1)) * 160;
                  return (
                    <g key={i}>
                      {i > 0 && (() => {
                        const px = 20 + ((i - 1) / Math.max((d?.success_trend.length || 1) - 1, 1)) * 260;
                        const py = 180 - ((d?.success_trend[i - 1].rate || 0) / maxRate) * 160;
                        return <line x1={px} y1={py} x2={x} y2={y} stroke="#52c41a" strokeWidth="2" />;
                      })()}
                      <circle cx={x} cy={y} r="4" fill="#52c41a" />
                      <text x={x} y={y - 10} textAnchor="middle" fontSize="10">{v.rate}%</text>
                      <text x={x} y={195} textAnchor="middle" fontSize="9" fill="#888">{v.date}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Point cấp vs tiêu thụ theo tuần">
            <div style={{ position: 'relative', height: 200 }}>
              <svg viewBox="0 0 300 200" style={{ width: '100%', height: '100%' }}>
                {(d?.weekly_issued || []).map((v, i) => {
                  const x = 20 + (i / Math.max((d?.weekly_issued.length || 1) - 1, 1)) * 260;
                  const h1 = (v.value / maxW) * 160;
                  const h2 = ((d?.weekly_consumed[i]?.value || 0) / maxW) * 160;
                  return (
                    <g key={i}>
                      <rect x={x - 8} y={180 - h1} width="10" height={h1} fill="#52c41a" rx="2" />
                      <rect x={x + 4} y={180 - h2} width="10" height={h2} fill="#ff4d4f" rx="2" />
                      <text x={x} y={195} textAnchor="middle" fontSize="9" fill="#888">{v.date}</text>
                    </g>
                  );
                })}
              </svg>
              <div style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: '#52c41a' }}>■ Cấp</span>
                <span style={{ color: '#ff4d4f', marginLeft: 16 }}>■ Tiêu thụ</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Phân bổ point theo module">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <svg viewBox="0 0 32 32" style={{ width: 140, height: 140 }}>
                  {(() => {
                    const items = d?.by_module || [];
                    if (items.length === 0) {
                      return <circle cx="16" cy="16" r="14" fill="#f0f0f0" />;
                    }
                    let offset = 0;
                    const total = items.reduce((s, m) => s + m.value, 0);
                    return items.map((m, i) => {
                      const pct = m.value / total;
                      const angle = pct * 360;
                      const largeArc = angle > 180 ? 1 : 0;
                      const startAngle = (offset * Math.PI) / 180;
                      const endAngle = ((offset + angle) * Math.PI) / 180;
                      const x1 = 16 + 14 * Math.sin(startAngle);
                      const y1 = 16 - 14 * Math.cos(startAngle);
                      const x2 = 16 + 14 * Math.sin(endAngle);
                      const y2 = 16 - 14 * Math.cos(endAngle);
                      offset += angle;
                      const r = (
                        <path
                          key={i}
                          d={`M 16 16 L ${x1} ${y1} A 14 14 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      );
                      return r;
                    });
                  })()}
                  <circle cx="16" cy="16" r="8" fill="white" />
                </svg>
              </div>
              <div>
                {(d?.by_module || []).map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontSize: 12 }}>{m.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 'bold' }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Phân bổ theo quốc gia">
            <div style={{ height: 150 }}>
              {(d?.by_module || []).slice(0, 5).map((m, i) => {
                const pct = moduleTotal > 0 ? (m.value / moduleTotal) * 100 : 0;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 80, fontSize: 12 }}>{m.name}</span>
                    <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                    </div>
                    <span style={{ width: 50, textAlign: 'right', fontSize: 12 }}>{m.value} PT</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top 10 cán bộ sử dụng nhiều nhất">
            <Table
              dataSource={d?.top_officers || []}
              columns={[
                { title: '#', key: 'rank', render: (_: any, __: any, i: number) => i + 1, width: 40 },
                { title: 'Tên', dataIndex: 'name', key: 'name' },
                { title: 'Point', dataIndex: 'points', key: 'points' },
                { title: 'Giao dịch', dataIndex: 'txns', key: 'txns' },
              ]}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={<span>Sức khỏe hệ thống <span style={{ fontSize: 12, fontWeight: 'normal', marginLeft: 8 }}>(cập nhật 30s)</span></span>}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Text>CPU: {health?.cpu.percent ?? '--'}% ({health?.cpu.cores ?? '--'} cores)</Text>
                <Progress percent={health?.cpu.percent ?? 0} size="small" status={health?.cpu.percent && health.cpu.percent > 80 ? 'exception' : undefined} />
              </Col>
              <Col xs={24} sm={8}>
                <Text>RAM: {health?.memory.percent ?? '--'}% ({health ? formatBytes(health.memory.used) : '--'} / {health ? formatBytes(health.memory.total) : '--'})</Text>
                <Progress percent={health?.memory.percent ?? 0} size="small" status={health?.memory.percent && health.memory.percent > 80 ? 'exception' : undefined} />
              </Col>
              <Col xs={24} sm={8}>
                <Text>Ổ đĩa: {health?.disk.percent ?? '--'}% ({health ? formatBytes(health.disk.used) : '--'} / {health ? formatBytes(health.disk.total) : '--'})</Text>
                <Progress percent={health?.disk.percent ?? 0} size="small" status={health?.disk.percent && health.disk.percent > 80 ? 'exception' : undefined} />
              </Col>
            </Row>
            {health?.gpu && health.gpu.length > 0 && (
              <Row gutter={16} style={{ marginTop: 12 }}>
                {health.gpu.map((g, i) => (
                  <Col key={i} xs={24} sm={12} lg={6}>
                    <Text>{g.name}: {g.load.toFixed(0)}% (VRAM: {g.memory_used}/{g.memory_total} MB)</Text>
                    <Progress percent={g.load} size="small" />
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [d, setD] = useState<OfficerDashboard | null>(null);

  useEffect(() => {
    dashboardApi.officer().then(r => setD(r.data.data)).catch(() => {});
  }, []);

  const maxVol = Math.max(...(d?.weekly_volume.map(v => v.value) || [0]), 1);

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Số dư Point" value={user?.points || 0} prefix={<DollarOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Lượt xử lý" value={d?.total_jobs || 0} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card><Statistic title="Tỷ lệ thành công" value={d?.success_rate || 0} suffix="%" prefix={<CheckCircleOutlined />} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Khối lượng xử lý 7 ngày">
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 8 }}>
              {(d?.weekly_volume || []).map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%', background: '#1890ff', borderRadius: '4px 4px 0 0',
                    height: `${(v.value / maxVol) * 170}px`, minHeight: v.value > 0 ? 4 : 0,
                    transition: 'height 0.5s',
                  }} />
                  <span style={{ fontSize: 11, marginTop: 4 }}>{v.value}</span>
                  <span style={{ fontSize: 10, color: '#888' }}>{v.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="5 giao dịch gần nhất">
            <Table
              dataSource={d?.recent_txns || []}
              columns={[
                { title: 'Thời gian', dataIndex: 'time', key: 'time', render: (v: string) => v ? new Date(v).toLocaleString('vi-VN') : '' },
                { title: 'Point', dataIndex: 'point', key: 'point', render: (p: number) => <span style={{ color: p >= 0 ? '#52c41a' : '#ff4d4f' }}>{p >= 0 ? `+${p}` : p}</span> },
                { title: 'Số dư sau', dataIndex: 'balance_after', key: 'balance_after' },
                { title: 'Ghi chú', dataIndex: 'reason', key: 'reason', render: (v: string | null) => v || '-' },
              ]}
              rowKey={(_, i) => String(i || 0)}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

const DashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <OfficerDashboard />;
};

export default DashboardPage;
