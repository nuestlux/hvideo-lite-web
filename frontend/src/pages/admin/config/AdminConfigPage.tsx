import React, { useState, useEffect } from 'react';
import {
  Card, Button, message, Typography, Space, InputNumber,
  Select, Popconfirm, Tag, Spin, Tooltip, Badge,
} from 'antd';
import {
  SaveOutlined, InfoCircleOutlined,
  ThunderboltOutlined, VideoCameraOutlined, CarOutlined,
  SettingOutlined, DatabaseOutlined, ClockCircleOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { configApi } from '../../../api/config';
import type { ConfigItem } from '../../../api/config';
import PageHeader from '../../../components/PageHeader';

const { Text } = Typography;

// ─── Metadata hiển thị cho từng key ──────────────────────────────────────────
const CONFIG_META: Record<string, {
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  isSelect?: boolean;
  selectOptions?: { value: string; label: string }[];
  tooltip?: string;
  icon?: React.ReactNode;
}> = {
  lp_vn_cost:   { label: 'Biển số Việt Nam', unit: 'point', min: 1, max: 100, icon: <CarOutlined />, tooltip: 'Model AI nhận dạng biển số VN (ví dụ: 30A-12345)' },
  lp_us_cost:   { label: 'Biển số Hoa Kỳ',  unit: 'point', min: 1, max: 100, icon: <CarOutlined />, tooltip: 'Model AI nhận dạng biển số Mỹ' },
  lp_jp_cost:   { label: 'Biển số Nhật Bản',unit: 'point', min: 1, max: 100, icon: <CarOutlined />, tooltip: 'Model AI nhận dạng biển số Nhật' },
  lp_kr_cost:   { label: 'Biển số Hàn Quốc',unit: 'point', min: 1, max: 100, icon: <CarOutlined />, tooltip: 'Model AI nhận dạng biển số Hàn' },
  lp_eu_cost:   { label: 'Biển số Châu Âu', unit: 'point', min: 1, max: 100, icon: <CarOutlined />, tooltip: 'Model AI nhận dạng biển số EU' },
  lp_cn_cost:   { label: 'Biển số Trung Quốc',unit: 'point', min: 1, max: 100, icon: <CarOutlined />, tooltip: 'Model AI nhận dạng biển số Trung Quốc' },

  video_repair_basic_cost:    { label: 'Khôi phục nhanh (không AI)', unit: 'point', min: 1, max: 200, icon: <VideoCameraOutlined />, tooltip: 'Sửa video cơ bản, không dùng AI (~2 phút)' },
  video_repair_advanced_cost: { label: 'Khôi phục nâng cao (AI)',   unit: 'point', min: 1, max: 200, icon: <ThunderboltOutlined />, tooltip: 'Sửa video bằng AI nâng cao (~8 phút)' },
  video_repair_reference_cost:{ label: 'Sửa theo file tham chiếu',  unit: 'point', min: 1, max: 200, icon: <VideoCameraOutlined />, tooltip: 'Khôi phục video dùng file tham chiếu kèm theo' },

  queue_mode:           { label: 'Chế độ hàng đợi', isSelect: true, selectOptions: [{ value: 'FIFO', label: 'FIFO – Vào trước ra trước' }, { value: 'LIFO', label: 'LIFO – Vào sau ra trước' }], icon: <SettingOutlined />, tooltip: 'Thứ tự xử lý các tác vụ trong hàng đợi' },
  max_concurrent_jobs:  { label: 'Số tác vụ chạy đồng thời', unit: 'tác vụ', min: 1, max: 50, icon: <ThunderboltOutlined />, tooltip: 'Tối đa bao nhiêu tác vụ xử lý cùng lúc trên máy chủ' },
  max_queue_size:       { label: 'Kích thước hàng đợi tối đa', unit: 'tác vụ', min: 10, max: 500, icon: <DatabaseOutlined />, tooltip: 'Số lượng tác vụ tối đa chờ trong hàng đợi' },
  job_timeout_minutes:  { label: 'Thời gian chờ tối đa mỗi tác vụ', unit: 'phút', min: 5, max: 120, icon: <ClockCircleOutlined />, tooltip: 'Nếu vượt quá giới hạn này, tác vụ sẽ bị hủy tự động' },
  storage_limit_mb:     { label: 'Dung lượng lưu trữ mặc định / người dùng', unit: 'MB', min: 100, max: 102400, icon: <DatabaseOutlined />, tooltip: 'Dung lượng lưu trữ file mặc định cho mỗi tài khoản (override bởi gói)' },
  max_upload_size_mb:   { label: 'Kích thước file tải lên tối đa', unit: 'MB', min: 10, max: 2048, icon: <DatabaseOutlined />, tooltip: 'Giới hạn kích thước mỗi file khi người dùng tải lên hệ thống' },
  max_video_duration_sec: { label: 'Thời lượng video tối đa xử lý', unit: 'giây', min: 60, max: 3600, icon: <ClockCircleOutlined />, tooltip: 'Video dài hơn giới hạn này sẽ bị từ chối xử lý' },
};

// ─── Component nhập giá trị cho 1 config key ─────────────────────────────────
const ConfigField: React.FC<{
  item: ConfigItem;
  value: string;
  onChange: (val: string) => void;
  dirty: boolean;
}> = ({ item, value, onChange, dirty }) => {
  const meta = CONFIG_META[item.key] || { label: item.key };
  const isSelect = meta.isSelect;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
      {/* Icon + label */}
      <div style={{ flex: '0 0 36px', paddingTop: 6, color: '#1677ff', fontSize: 18 }}>
        {meta.icon || <SettingOutlined />}
      </div>
      <div style={{ flex: 1 }}>
        <Space size={4}>
          <Text strong style={{ fontSize: 14 }}>{meta.label || item.key}</Text>
          {meta.tooltip && (
            <Tooltip title={meta.tooltip}><InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 13 }} /></Tooltip>
          )}
          {dirty && <Badge dot color="orange" />}
        </Space>
        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>{item.description}</div>
      </div>
      {/* Input */}
      <div style={{ flex: '0 0 220px', textAlign: 'right' }}>
        {isSelect ? (
          <Select
            value={value}
            onChange={(v) => onChange(v)}
            style={{ width: 220 }}
            options={meta.selectOptions}
          />
        ) : (
          <InputNumber
            value={Number(value)}
            onChange={(v) => onChange(String(v ?? 0))}
            style={{ width: 180 }}
            min={meta.min ?? 0}
            max={meta.max}
            addonAfter={meta.unit}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(v) => Number(v?.replace(/,/g, '') || 0) as any}
          />
        )}
      </div>
    </div>
  );
};

// ─── Component nhóm cấu hình (có thể thu gọn) ─────────────────────────────────
const ConfigSection: React.FC<{
  title: string;
  description?: string;
  keys: string[];
  configs: ConfigItem[];
  values: Record<string, string>;
  originals: Record<string, string>;
  onChange: (key: string, val: string) => void;
}> = ({ title, description, keys, configs, values, originals, onChange }) => {
  const [collapsed, setCollapsed] = useState(false);

  const items = configs.filter((c) => keys.includes(c.key));
  if (items.length === 0) return null;

  const dirtyCount = items.filter((c) => values[c.key] !== originals[c.key]).length;

  const toggle = () => setCollapsed(!collapsed);

  return (
    <Card
      title={
        <div
          onClick={toggle}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
        >
          {collapsed ? (
            <RightOutlined style={{ fontSize: 12, color: '#888' }} />
          ) : (
            <DownOutlined style={{ fontSize: 12, color: '#888' }} />
          )}
          <span>{title}</span>
          {dirtyCount > 0 && <Tag color="orange">{dirtyCount} chưa lưu</Tag>}
        </div>
      }
      style={{ marginBottom: 20, borderRadius: 10 }}
      extra={description && <Text type="secondary" style={{ fontSize: 12 }}>{description}</Text>}
    >
      {!collapsed && items.map((item) => (
        <ConfigField
          key={item.key}
          item={item}
          value={values[item.key] ?? item.value}
          dirty={values[item.key] !== originals[item.key]}
          onChange={(v) => onChange(item.key, v)}
        />
      ))}
    </Card>
  );
};

// ─── Trang chính ──────────────────────────────────────────────────────────────
const SystemConfigTab: React.FC = () => {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [originals, setOriginals] = useState<Record<string, string>>({});

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await configApi.list();
      const data = res.data.data;
      setConfigs(data);
      const map: Record<string, string> = {};
      data.forEach((c) => { map[c.key] = c.value; });
      setValues({ ...map });
      setOriginals({ ...map });
    } catch {
      message.error('Không thể tải cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const dirtyKeys = Object.keys(values).filter((k) => values[k] !== originals[k]);
  const isDirty = dirtyKeys.length > 0;

  const handleSave = async () => {
    if (!isDirty) { message.info('Không có thay đổi nào cần lưu'); return; }
    const payload: Record<string, string> = {};
    dirtyKeys.forEach((k) => { payload[k] = values[k]; });
    setSaving(true);
    try {
      await configApi.update(payload);
      message.success(`Đã lưu ${dirtyKeys.length} cấu hình thành công`);
      fetchConfigs();
    } catch (err: any) {
      message.error(err.response?.data?.detail?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await configApi.resetDefaults();
      const data = res.data.data;
      setConfigs(data);
      const map: Record<string, string> = {};
      data.forEach((c) => { map[c.key] = c.value; });
      setValues({ ...map });
      setOriginals({ ...map });
      message.success('Đã khôi phục về mặc định');
    } catch (err: any) {
      message.error(err.response?.data?.detail?.message || 'Khôi phục thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setValues({ ...originals });
    message.info('Đã hủy thay đổi');
  };

  const lpKeys = ['lp_vn_cost', 'lp_us_cost', 'lp_jp_cost', 'lp_kr_cost', 'lp_eu_cost', 'lp_cn_cost'];
  const videoKeys = ['video_repair_basic_cost', 'video_repair_advanced_cost', 'video_repair_reference_cost'];
  const systemKeys = ['queue_mode', 'max_concurrent_jobs', 'max_queue_size', 'job_timeout_minutes', 'storage_limit_mb', 'max_upload_size_mb', 'max_video_duration_sec'];

  return (
    <Spin spinning={loading}>
      <PageHeader
        title={t('config.title')}
        subtitle={t('config.subtitle')}
        extra={
          <Space>
            {isDirty && (
              <Button onClick={handleDiscard}>Hủy thay đổi</Button>
            )}
            <Popconfirm
              title="Khôi phục về mặc định?"
              description="Toàn bộ cấu hình sẽ về giá trị ban đầu."
              okText="Khôi phục" cancelText="Hủy"
              onConfirm={handleReset}
            >
              <Button danger loading={saving}>Khôi phục mặc định</Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty}
            >
              Lưu thay đổi {isDirty && `(${dirtyKeys.length})`}
            </Button>
          </Space>
        }
      />

      {/* Section 1: Chi phí biển số */}
      <ConfigSection
        title="🚗 Chi phí AI – Nhận dạng biển số xe"
        description="Tính theo mô hình AI của từng quốc gia, áp dụng mỗi lần nhận dạng"
        keys={lpKeys}
        configs={configs}
        values={values}
        originals={originals}
        onChange={handleChange}
      />

      {/* Section 2: Chi phí video */}
      <ConfigSection
        title="🎬 Chi phí AI – Khôi phục video"
        description="Tính theo chế độ xử lý video được người dùng chọn"
        keys={videoKeys}
        configs={configs}
        values={values}
        originals={originals}
        onChange={handleChange}
      />

      {/* Section 3: Phần cứng / hệ thống */}
      <ConfigSection
        title="⚙️ Giới hạn phần cứng & hệ thống"
        description="Các thông số vận hành máy chủ và giới hạn sử dụng"
        keys={systemKeys}
        configs={configs}
        values={values}
        originals={originals}
        onChange={handleChange}
      />
    </Spin>
  );
};

export default SystemConfigTab;
