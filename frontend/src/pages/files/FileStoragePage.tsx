import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Upload,
  Select,
  Tag,
  Progress,
  Space,
  Typography,
  message,
  Modal,
  Image,
  Input,
  Segmented,
  Empty,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  EyeOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { filesApi } from '../../api/files';
import type { FileItem, FileQuota } from '../../api/files';

const { Text } = Typography;

const processedLabels: Record<string, string> = {
  chua_xu_ly: 'Chưa xử lý',
  dang_xu_ly: 'Đang xử lý',
  hoan_thanh: 'Hoàn thành',
  that_bai: 'Thất bại',
};

const processedColors: Record<string, string> = {
  chua_xu_ly: 'default',
  dang_xu_ly: 'processing',
  hoan_thanh: 'success',
  that_bai: 'error',
};

const fileTypeLabels: Record<string, string> = {
  image: 'Ảnh',
  video: 'Video',
  other: 'Khác',
};

const fileTypeColors: Record<string, string> = {
  image: 'blue',
  video: 'purple',
  other: 'gold',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(mime: string | null): 'image' | 'video' | 'other' {
  if (mime?.startsWith('image/')) return 'image';
  if (mime?.startsWith('video/')) return 'video';
  return 'other';
}

const FileStoragePage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<FileQuota | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [processed, setProcessed] = useState('');
  const [fileType, setFileType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await filesApi.list({
        search: search || undefined,
        processed: processed || undefined,
        file_type: fileType || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 20,
      });
      setFiles(res.data.data.items);
      setTotal(res.data.data.total);
    } catch {
      message.error('Không thể tải danh sách file');
    } finally {
      setLoading(false);
    }
  }, [fileType, page, processed, search, sortBy, sortOrder]);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await filesApi.quota();
      setQuota(res.data.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await filesApi.upload(file);
      message.success('Tải lên thành công');
      fetchFiles();
      fetchQuota();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Tải lên thất bại';
      message.error(msg);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xóa file?',
      content: 'File sẽ bị xóa vĩnh viễn.',
      onOk: async () => {
        try {
          await filesApi.delete(id);
          message.success('Đã xóa file');
          fetchFiles();
          fetchQuota();
        } catch {
          message.error('Xóa thất bại');
        }
      },
    });
  };

  const handlePreview = (r: FileItem) => {
    if (getFileType(r.mime_type) === 'image') {
      setPreviewUrl(`/api/files/${r.id}/download`);
    } else {
      message.info('Chỉ hỗ trợ xem trước ảnh');
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setProcessed('');
    setFileType('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const activeFilters = useMemo(() => {
    const items: { key: string; label: string; onClose: () => void }[] = [];
    if (search) items.push({ key: 'search', label: `Tìm: ${search}`, onClose: () => setSearchInput('') });
    if (processed) items.push({ key: 'processed', label: `TT: ${processedLabels[processed] || processed}`, onClose: () => { setProcessed(''); setPage(1); } });
    if (fileType) items.push({ key: 'type', label: `Loại: ${fileTypeLabels[fileType] || fileType}`, onClose: () => { setFileType(''); setPage(1); } });
    if (sortBy !== 'created_at' || sortOrder !== 'desc') {
      const sortLabel = sortBy === 'size' ? 'Kích thước' : sortBy === 'original_name' ? 'Tên file' : 'Ngày tải lên';
      items.push({ key: 'sort', label: `Sắp xếp: ${sortLabel} ${sortOrder === 'asc' ? '↑' : '↓'}`, onClose: () => { setSortBy('created_at'); setSortOrder('desc'); setPage(1); } });
    }
    return items;
  }, [fileType, processed, search, sortBy, sortOrder]);

  const quotaPercent = quota?.percent || 0;
  const usedFormatted = formatSize(quota?.used || 0);
  const limitFormatted = formatSize(quota?.limit || 0);

  const columns = [
    {
      title: 'Tên file',
      key: 'name',
      render: (_: any, r: FileItem) => {
        const type = getFileType(r.mime_type);
        return (
          <Space>
            <FileOutlined />
            <div>
              <div><Text strong>{r.original_name}</Text></div>
              <Space size={6} wrap>
                <Tag color={fileTypeColors[type]}>{fileTypeLabels[type]}</Tag>
                <Text type="secondary">{r.folder}</Text>
              </Space>
            </div>
          </Space>
        );
      },
    },
    { title: 'Kích thước', dataIndex: 'size', key: 'size', render: (s: number) => formatSize(s) },
    { title: 'Ngày tải lên', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v ? new Date(v).toLocaleString('vi-VN') : '' },
    {
      title: 'Trạng thái',
      dataIndex: 'processed',
      key: 'processed',
      render: (p: string) => <Tag color={processedColors[p]}>{processedLabels[p] || p}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, r: FileItem) => {
        const type = getFileType(r.mime_type);
        return (
          <Space>
            {type === 'image' && (
              <Button size="small" icon={<EyeOutlined />} onClick={() => handlePreview(r)}>Xem</Button>
            )}
            <Button size="small" icon={<DownloadOutlined />} onClick={() => filesApi.download(r.id)}>Tải xuống</Button>
            <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(r.id)}>Xóa</Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Card
        title="Bộ nhớ"
        style={{ marginBottom: 16 }}
        extra={<Tag color="blue">{files.length}/{total} đang xem</Tag>}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Progress type="circle" percent={Math.min(quotaPercent, 100)} size={80} />
          <div>
            <Text strong style={{ display: 'block' }}>Đã dùng: {usedFormatted} / {limitFormatted}</Text>
            <Text type="secondary">Theo dõi dung lượng lưu trữ và tối ưu quản lý file.</Text>
          </div>
        </div>
      </Card>

      <Card title="File của tôi">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            <Col xs={24} lg={18}>
              <Space wrap style={{ width: '100%' }}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Tìm theo tên file..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ width: 240 }}
                />
                <Select
                  placeholder="Loại file"
                  value={fileType || undefined}
                  allowClear
                  style={{ width: 140 }}
                  onChange={(val) => { setFileType(val || ''); setPage(1); }}
                  options={[
                    { value: 'image', label: 'Ảnh' },
                    { value: 'video', label: 'Video' },
                    { value: 'other', label: 'Khác' },
                  ]}
                />
                <Select
                  placeholder="Trạng thái"
                  value={processed || undefined}
                  allowClear
                  style={{ width: 160 }}
                  onChange={(val) => { setProcessed(val || ''); setPage(1); }}
                  options={[
                    { value: 'chua_xu_ly', label: 'Chưa xử lý' },
                    { value: 'dang_xu_ly', label: 'Đang xử lý' },
                    { value: 'hoan_thanh', label: 'Hoàn thành' },
                    { value: 'that_bai', label: 'Thất bại' },
                  ]}
                />
                <Select
                  value={sortBy}
                  style={{ width: 160 }}
                  onChange={(val) => { setSortBy(val); setPage(1); }}
                  options={[
                    { value: 'created_at', label: 'Ngày tải lên' },
                    { value: 'size', label: 'Kích thước' },
                    { value: 'original_name', label: 'Tên file' },
                  ]}
                />
                <Select
                  value={sortOrder}
                  style={{ width: 110 }}
                  onChange={(val) => { setSortOrder(val); setPage(1); }}
                  options={[
                    { value: 'desc', label: 'Giảm dần' },
                    { value: 'asc', label: 'Tăng dần' },
                  ]}
                />
                <Button icon={<ReloadOutlined />} onClick={resetFilters}>Đặt lại</Button>
              </Space>
            </Col>

            <Col xs={24} lg={6} style={{ textAlign: 'right' }}>
              <Space wrap>
                <Segmented
                  value={viewMode}
                  onChange={(val) => setViewMode(val as 'table' | 'grid')}
                  options={[
                    { label: 'Bảng', value: 'table', icon: <UnorderedListOutlined /> },
                    { label: 'Lưới', value: 'grid', icon: <AppstoreOutlined /> },
                  ]}
                />
                <Upload accept="image/*,video/*" showUploadList={false} beforeUpload={handleUpload}>
                  <Button type="primary" icon={<UploadOutlined />} loading={uploading}>Tải lên</Button>
                </Upload>
              </Space>
            </Col>
          </Row>

          {activeFilters.length > 0 && (
            <div>
              <Space wrap>
                {activeFilters.map((item) => (
                  <Tag key={item.key} closable onClose={(e) => { e.preventDefault(); item.onClose(); }}>
                    {item.label}
                  </Tag>
                ))}
                <Button type="link" size="small" onClick={resetFilters}>Xóa tất cả</Button>
              </Space>
            </div>
          )}

          <Divider style={{ margin: '8px 0' }} />

          {viewMode === 'table' ? (
            <Table
              dataSource={files}
              columns={columns as any}
              rowKey="id"
              loading={loading}
              pagination={{
                current: page,
                total,
                pageSize: 20,
                onChange: (p) => setPage(p),
                showTotal: (t) => `Tổng: ${t}`,
              }}
              scroll={{ x: 960 }}
              locale={{
                emptyText: (
                  <Empty
                    description="Chưa có file phù hợp"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Space>
                      <Button onClick={resetFilters}>Xóa filter</Button>
                      <Upload accept="image/*,video/*" showUploadList={false} beforeUpload={handleUpload}>
                        <Button type="primary">Tải lên file mới</Button>
                      </Upload>
                    </Space>
                  </Empty>
                ),
              }}
            />
          ) : (
            <div>
              <Row gutter={[16, 16]}>
                {files.map((r) => {
                  const type = getFileType(r.mime_type);
                  const previewSrc = type === 'image' ? `/api/files/${r.id}/download` : undefined;
                  return (
                    <Col xs={24} sm={12} lg={8} xl={6} key={r.id}>
                      <Card
                        hoverable
                        style={{ height: '100%' }}
                        bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                        cover={
                          <div
                            style={{
                              height: 180,
                              background: type === 'image' ? '#f5f7ff' : type === 'video' ? '#f7f0ff' : '#fff8e8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              cursor: type === 'image' ? 'pointer' : 'default',
                            }}
                            onClick={() => type === 'image' && handlePreview(r)}
                          >
                            {type === 'image' && previewSrc ? (
                              <Image
                                src={previewSrc}
                                alt={r.original_name}
                                preview={false}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : type === 'video' ? (
                              <VideoCameraOutlined style={{ fontSize: 42, color: '#7c3aed' }} />
                            ) : (
                              <FileTextOutlined style={{ fontSize: 42, color: '#d97706' }} />
                            )}
                          </div>
                        }
                      >
                        <Space direction="vertical" style={{ width: '100%', flex: 1 }} size={8}>
                          <div>
                            <Text strong ellipsis>{r.original_name}</Text>
                            <div style={{ marginTop: 4 }}>
                              <Space wrap size={6}>
                                <Tag color={fileTypeColors[type]}>{fileTypeLabels[type]}</Tag>
                                <Tag color={processedColors[r.processed]}>{processedLabels[r.processed] || r.processed}</Tag>
                              </Space>
                            </div>
                          </div>

                          <Text type="secondary">{formatSize(r.size)} • {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}</Text>

                          <div style={{ marginTop: 'auto' }}>
                            <Space wrap>
                              {type === 'image' && (
                                <Button size="small" icon={<EyeOutlined />} onClick={() => handlePreview(r)}>Xem</Button>
                              )}
                              <Button size="small" icon={<DownloadOutlined />} onClick={() => filesApi.download(r.id)}>Tải xuống</Button>
                              <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDelete(r.id)}>Xóa</Button>
                            </Space>
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {!loading && files.length === 0 && (
                <Empty
                  style={{ padding: '32px 0' }}
                  description="Chưa có file phù hợp"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Space>
                    <Button onClick={resetFilters}>Xóa filter</Button>
                    <Upload accept="image/*,video/*" showUploadList={false} beforeUpload={handleUpload}>
                      <Button type="primary">Tải lên file mới</Button>
                    </Upload>
                  </Space>
                </Empty>
              )}

              {files.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <Text type="secondary">Tổng: {total}</Text>
                </div>
              )}
            </div>
          )}
        </Space>
      </Card>

      <Image
        style={{ display: 'none' }}
        preview={{
          visible: !!previewUrl,
          src: previewUrl || undefined,
          onVisibleChange: (v) => { if (!v) setPreviewUrl(null); },
        }}
      />
    </>
  );
};

export default FileStoragePage;
