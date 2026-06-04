import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Typography, Segmented, Spin, DatePicker } from 'antd';
const { Text, Title } = Typography;
import { 
  ThunderboltOutlined, TeamOutlined, CheckCircleOutlined, DollarOutlined, 
  AppstoreOutlined, SafetyOutlined, WarningOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi } from '../../api/dashboard';
import type { AdminDashboard as AdminDashboardType, OfficerDashboard as OfficerDashboardType, ServerHealth } from '../../api/dashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, Label, LineChart, Line
} from 'recharts';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const cardStyle = { borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: 'none' };
const statCardStyle = { ...cardStyle, background: 'linear-gradient(145deg, #ffffff, #f9f9f9)' };

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const chartData = data.map((val, i) => ({ name: i, value: val }));
  return (
    <div style={{ width: 80, height: 35 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const AdminDashboard: React.FC<{ timeRange: string }> = ({ timeRange }) => {
  const [d, setD] = useState<AdminDashboardType | null>(null);
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    dashboardApi.admin(timeRange).then(r => setD(r.data.data)).finally(() => setLoading(false));
  }, [timeRange]);

  useEffect(() => {
    const fetchHealth = () => dashboardApi.serverHealth().then(r => setHealth(r.data.data)).catch(() => {});
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const weeklyCombinedData = d?.weekly_issued.map((item, i) => ({
    date: item.date,
    issued: item.value,
    consumed: d?.weekly_consumed[i]?.value || 0
  })) || [];

  const moduleTotal = d?.by_module.reduce((s, m) => s + m.value, 0) || 1;

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card style={statCardStyle} hoverable bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Statistic title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Tổng cán bộ</span>} value={d?.summary.total_users?.value || 0} prefix={<TeamOutlined style={{ color: '#1890ff' }} />} valueStyle={{ fontWeight: 600, fontSize: 28 }} />
              {d?.summary.total_users && (
                <div style={{ textAlign: 'right' }}>
                  <Sparkline data={d.summary.total_users.trend} color={d.summary.total_users.isUp ? '#52c41a' : '#ff4d4f'} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: d.summary.total_users.isUp ? '#52c41a' : '#ff4d4f' }}>
                    {d.summary.total_users.isUp ? '▲' : '▼'} {d.summary.total_users.percentChange}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={statCardStyle} hoverable bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Statistic title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Tổng lượt xử lý</span>} value={d?.summary.total_jobs?.value || 0} prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />} valueStyle={{ fontWeight: 600, fontSize: 28 }} />
              {d?.summary.total_jobs && (
                <div style={{ textAlign: 'right' }}>
                  <Sparkline data={d.summary.total_jobs.trend} color={d.summary.total_jobs.isUp ? '#52c41a' : '#ff4d4f'} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: d.summary.total_jobs.isUp ? '#52c41a' : '#ff4d4f' }}>
                    {d.summary.total_jobs.isUp ? '▲' : '▼'} {d.summary.total_jobs.percentChange}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={statCardStyle} hoverable bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Statistic title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Tỷ lệ thành công</span>} value={d?.summary.success_rate?.value || 0} suffix="%" prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ fontWeight: 600, fontSize: 28 }} />
              {d?.summary.success_rate && (
                <div style={{ textAlign: 'right' }}>
                  <Sparkline data={d.summary.success_rate.trend} color={d.summary.success_rate.isUp ? '#52c41a' : '#ff4d4f'} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: d.summary.success_rate.isUp ? '#52c41a' : '#ff4d4f' }}>
                    {d.summary.success_rate.isUp ? '▲' : '▼'} {d.summary.success_rate.percentChange}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={{ fontWeight: 600 }}>Khối lượng xử lý theo ngày</span>} style={cardStyle}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d?.daily_volume || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(24, 144, 255, 0.05)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Biển số" name="Biển số" stackId="a" fill="#1890ff" animationDuration={1200} barSize={32} />
                  <Bar dataKey="Sửa video" name="Sửa video" stackId="a" fill="#52c41a" radius={[6, 6, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={{ fontWeight: 600 }}>Xu hướng tỷ lệ thành công</span>} style={cardStyle}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d?.success_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} domain={['dataMin - 10', 100]} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <Tooltip cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1 }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="rate" name="Thành công" stroke="#52c41a" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" animationDuration={1200} dot={{ stroke: '#52c41a', strokeWidth: 2, r: 5, fill: '#fff' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#52c41a' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={{ fontWeight: 600 }}>Point cấp vs tiêu thụ theo tuần</span>} style={cardStyle}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCombinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="issued" name="Cấp" fill="#52c41a" radius={[4, 4, 0, 0]} animationDuration={1000} barSize={16} />
                  <Bar dataKey="consumed" name="Tiêu thụ" fill="#ff4d4f" radius={[4, 4, 0, 0]} animationDuration={1000} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={{ fontWeight: 600 }}>Phân bổ point theo module</span>} style={cardStyle}>
            <div style={{ display: 'flex', gap: 16, height: 260, alignItems: 'center' }}>
              {/* Donut bên trái */}
              <div style={{ width: '45%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d?.by_module || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      animationDuration={1200}
                      stroke="none"
                    >
                      {(d?.by_module || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <Label
                        value={d?.by_module.reduce((s, m) => s + m.value, 0) || 0}
                        position="center"
                        style={{ fontSize: '24px', fontWeight: 'bold', fill: '#262626' }}
                      />
                      <Label
                        value="Tổng PT"
                        position="center"
                        dy={22}
                        style={{ fontSize: '11px', fill: '#8c8c8c', fontWeight: 500 }}
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Danh sách chi tiết bên phải */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                {(d?.by_module || []).map((m, i) => {
                  const pct = moduleTotal > 0 ? (m.value / moduleTotal) * 100 : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#262626', whiteSpace: 'nowrap' }}>{m.value} PT</span>
                      <span style={{ fontSize: 11, color: '#8c8c8c', width: 38, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={24}>
          <Card title={<span style={{ fontWeight: 600 }}>Top 10 cán bộ sử dụng nhiều nhất</span>} style={{ ...cardStyle, height: '100%' }}>
            <Table
              dataSource={d?.top_officers || []}
              columns={[
                { title: '#', key: 'rank', render: (_: any, __: any, i: number) => <span style={{ fontWeight: i < 3 ? 'bold' : 'normal', color: i === 0 ? '#faad14' : i === 1 ? '#8c8c8c' : i === 2 ? '#d46b08' : 'inherit' }}>{i + 1}</span>, width: 40 },
                { title: 'Tên', dataIndex: 'name', key: 'name', render: (t) => <span style={{ fontWeight: 500 }}>{t}</span> },
                { title: 'Point', dataIndex: 'points', key: 'points', render: (p) => <span style={{ color: '#1890ff', fontWeight: 600 }}>{p}</span> },
                { title: 'Giao dịch', dataIndex: 'txns', key: 'txns' },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 200 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={<span><span style={{ fontWeight: 600 }}>Sức khỏe hệ thống</span> <span style={{ fontSize: 12, fontWeight: 'normal', color: '#8c8c8c', marginLeft: 8 }}>(cập nhật 30s)</span></span>} style={cardStyle}>
            <Row gutter={24}>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>CPU</Text>
                  <Text type="secondary">{health?.cpu.cores ?? '--'} cores</Text>
                </div>
                <Progress percent={health?.cpu.percent ?? 0} size="small" status={health?.cpu.percent && health.cpu.percent > 80 ? 'exception' : 'active'} strokeColor="#1890ff" />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>RAM</Text>
                  <Text type="secondary">{health ? formatBytes(health.memory.used) : '--'} / {health ? formatBytes(health.memory.total) : '--'}</Text>
                </div>
                <Progress percent={health?.memory.percent ?? 0} size="small" status={health?.memory.percent && health.memory.percent > 80 ? 'exception' : 'active'} strokeColor="#52c41a" />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Ổ đĩa</Text>
                  <Text type="secondary">{health ? formatBytes(health.disk.used) : '--'} / {health ? formatBytes(health.disk.total) : '--'}</Text>
                </div>
                <Progress percent={health?.disk.percent ?? 0} size="small" status={health?.disk.percent && health.disk.percent > 80 ? 'exception' : 'active'} strokeColor="#faad14" />
              </Col>
            </Row>
            {health?.gpu && health.gpu.length > 0 && (
              <Row gutter={24} style={{ marginTop: 24 }}>
                {health.gpu.map((g, i) => (
                  <Col key={i} xs={24} sm={12} lg={6}>
                    <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong>{g.name}</Text>
                      <Text type="secondary">{g.memory_used}/{g.memory_total} MB</Text>
                    </div>
                    <Progress percent={g.load} size="small" strokeColor="#722ed1" />
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

const OfficerDashboard: React.FC<{ timeRange: string }> = ({ timeRange }) => {
  const { user } = useAuth();
  const [d, setD] = useState<OfficerDashboardType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    dashboardApi.officer(timeRange).then(r => setD(r.data.data)).finally(() => setLoading(false));
  }, [timeRange]);

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card style={statCardStyle} hoverable bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Statistic title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Số dư Point</span>} value={d?.points?.value || user?.points || 0} prefix={<DollarOutlined style={{ color: '#faad14' }} />} valueStyle={{ fontWeight: 600, fontSize: 28 }} />
              {d?.points && (
                <div style={{ textAlign: 'right' }}>
                  <Sparkline data={d.points.trend} color={d.points.isUp ? '#52c41a' : '#ff4d4f'} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: d.points.isUp ? '#52c41a' : '#ff4d4f' }}>
                    {d.points.isUp ? '▲' : '▼'} {d.points.percentChange}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={statCardStyle} hoverable bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Statistic title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Lượt xử lý</span>} value={d?.total_jobs?.value || 0} prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />} valueStyle={{ fontWeight: 600, fontSize: 28 }} />
              {d?.total_jobs && (
                <div style={{ textAlign: 'right' }}>
                  <Sparkline data={d.total_jobs.trend} color={d.total_jobs.isUp ? '#52c41a' : '#ff4d4f'} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: d.total_jobs.isUp ? '#52c41a' : '#ff4d4f' }}>
                    {d.total_jobs.isUp ? '▲' : '▼'} {d.total_jobs.percentChange}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={statCardStyle} hoverable bodyStyle={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Statistic title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Tỷ lệ thành công</span>} value={d?.success_rate?.value || 0} suffix="%" prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ fontWeight: 600, fontSize: 28 }} />
              {d?.success_rate && (
                <div style={{ textAlign: 'right' }}>
                  <Sparkline data={d.success_rate.trend} color={d.success_rate.isUp ? '#52c41a' : '#ff4d4f'} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: d.success_rate.isUp ? '#52c41a' : '#ff4d4f' }}>
                    {d.success_rate.isUp ? '▲' : '▼'} {d.success_rate.percentChange}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<span style={{ fontWeight: 600 }}>Khối lượng xử lý</span>} style={cardStyle}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d?.weekly_volume || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(24, 144, 255, 0.05)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Biển số" name="Biển số" stackId="a" fill="#1890ff" animationDuration={1200} barSize={32} />
                  <Bar dataKey="Sửa video" name="Sửa video" stackId="a" fill="#52c41a" radius={[6, 6, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<span style={{ fontWeight: 600 }}>5 giao dịch gần nhất</span>} style={{ ...cardStyle, height: '100%' }}>
            <Table
              dataSource={d?.recent_txns || []}
              columns={[
                { title: 'Thời gian', dataIndex: 'time', key: 'time', render: (v: string) => <span style={{ color: '#8c8c8c' }}>{v ? new Date(v).toLocaleString('vi-VN') : ''}</span> },
                { title: 'Point', dataIndex: 'point', key: 'point', render: (p: number) => <span style={{ fontWeight: 600, color: p >= 0 ? '#52c41a' : '#ff4d4f' }}>{p >= 0 ? `+${p}` : p}</span> },
                { title: 'Số dư sau', dataIndex: 'balance_after', key: 'balance_after', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
                { title: 'Ghi chú', dataIndex: 'reason', key: 'reason', render: (v: string | null) => v || '-' },
              ]}
              rowKey={(_, i) => String(i || 0)}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

const DashboardPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [timeRangeType, setTimeRangeType] = useState('7_days');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const effectiveTimeRange = timeRangeType === 'custom' && dateRange && dateRange[0] && dateRange[1]
    ? `${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}`
    : timeRangeType;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Xin chào, {user?.name} 👋</Title>
          <Text type="secondary">Theo dõi các chỉ số và hoạt động của bạn hôm nay</Text>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(0, 0, 0, 0.03)', 
          padding: '6px', 
          borderRadius: '12px',
          transition: 'all 0.3s ease'
        }}>
          {timeRangeType === 'custom' && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out', marginRight: 8 }}>
              <DatePicker.RangePicker
                bordered={false}
                onChange={(dates) => setDateRange(dates as any)}
                placeholder={['Từ ngày', 'Đến ngày']}
                format="DD/MM/YYYY"
                style={{ 
                  background: '#ffffff', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  padding: '6px 12px'
                }}
              />
            </div>
          )}
          <Segmented
            options={[
              { label: 'Hôm nay', value: 'today' },
              { label: '7 ngày', value: '7_days' },
              { label: '30 ngày', value: '30_days' },
              { label: 'Năm nay', value: 'year' },
              { label: 'Tùy chọn', value: 'custom' },
            ]}
            value={timeRangeType}
            onChange={(val) => setTimeRangeType(val as string)}
            style={{ background: 'transparent' }}
          />
        </div>
      </div>
      
      {isAdmin ? <AdminDashboard timeRange={effectiveTimeRange} /> : <OfficerDashboard timeRange={effectiveTimeRange} />}
    </div>
  );
};

export default DashboardPage;

