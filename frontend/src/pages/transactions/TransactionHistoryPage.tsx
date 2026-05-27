import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Select, Tag, Typography, Button, Input } from 'antd';
const { Text } = Typography;
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { pointsApi } from '../../api/points';
import type { Transaction } from '../../api/points';
import { useAuth } from '../../contexts/AuthContext';

const typeLabels: Record<string, string> = {
  admin_adjustment: 'Điều chỉnh',
  deduction: 'Tiêu thụ',
};

const typeColors: Record<string, string> = {
  admin_adjustment: 'blue',
  deduction: 'orange',
};

const typeOptions = [
  { value: '', label: 'Tất cả loại' },
  { value: 'admin_adjustment', label: 'Điều chỉnh' },
  { value: 'deduction', label: 'Tiêu thụ' },
];

const TransactionHistoryPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [service, setService] = useState('');
  const [txnType, setTxnType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20,
        service: service || undefined,
        txn_type: txnType || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (isAdmin) {
        if (search) params.search = search;
        const res = await pointsApi.listAdmin(params);
        setData(res.data.data.items);
        setTotal(res.data.data.total);
      } else {
        const res = await pointsApi.listMine({ service: params.service, page, limit: 20 });
        setData(res.data.data.items);
        setTotal(res.data.data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAdmin, service, txnType, search, sortBy, sortOrder, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    if (pagination.current !== page) {
      setPage(pagination.current);
    }
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  const columns: any[] = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      render: (v: string) => v ? new Date(v).toLocaleString('vi-VN') : '',
    },
    ...(isAdmin
      ? [{
          title: 'Người dùng',
          key: 'user',
          sorter: false,
          render: (_: any, record: Transaction) =>
            record.user_name
              ? <Text>{record.user_name}<br /><Text type="secondary" style={{ fontSize: 12 }}>{record.user_email}</Text></Text>
              : <Text>{record.user_id}</Text>,
        }]
      : []),
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      sorter: true,
      render: (t: string) => <Tag color={typeColors[t]}>{typeLabels[t] || t}</Tag>,
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'service',
      key: 'service',
      sorter: true,
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Point',
      dataIndex: 'point',
      key: 'point',
      sorter: true,
      render: (p: number) => <Text style={{ color: p >= 0 ? '#52c41a' : '#ff4d4f' }}>{p >= 0 ? `+${p}` : p}</Text>,
    },
    { title: 'Số dư sau', dataIndex: 'balance_after', key: 'balance_after', sorter: true },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason', render: (v: string | null) => v || '-' },
  ];

  const exportCsv = () => {
    const userHeader = isAdmin ? 'Người dùng,' : '';
    const headers = `Thời gian,${userHeader}Loại,Dịch vụ,Point,Số dư sau,Lý do\n`;
    const rows = data.map(t => {
      const user = isAdmin ? `"${t.user_name || t.user_id} ${t.user_email ? `(${t.user_email})` : ''}",` : '';
      return `"${t.created_at || ''}",${user}"${typeLabels[t.type] || t.type}","${t.service || ''}","${t.point}","${t.balance_after}","${t.reason || ''}"`;
    }).join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'giaodich.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card title="Lịch sử giao dịch" extra={<Button icon={<DownloadOutlined />} onClick={exportCsv}>Xuất CSV</Button>}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {isAdmin && (
          <>
            <Input
              placeholder="Tìm người dùng..."
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 250 }}
              allowClear
            />
            <Button onClick={handleSearch}>Tìm</Button>
          </>
        )}
        <Select
          placeholder="Dịch vụ"
          allowClear
          style={{ width: 180 }}
          onChange={(val) => { setService(val || ''); setPage(1); }}
          options={[
            { value: 'license_plate_image', label: 'Biển số (ảnh)' },
            { value: 'license_plate_video', label: 'Biển số (video)' },
            { value: 'video_repair_fast', label: 'Sửa video nhanh' },
            { value: 'video_repair_deep', label: 'Sửa video sâu' },
          ]}
        />
        <Select
          placeholder="Loại giao dịch"
          allowClear
          style={{ width: 180 }}
          onChange={(val) => { setTxnType(val || ''); setPage(1); }}
          options={typeOptions}
        />
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => setPage(p), showTotal: (t) => `Tổng: ${t}` }}
      />
    </Card>
  );
};

export default TransactionHistoryPage;