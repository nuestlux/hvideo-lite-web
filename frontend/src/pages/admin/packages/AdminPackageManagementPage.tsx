import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, message, Tag } from 'antd';
import { packagesApi } from '../../../api/packages';
import type { PointPackage, PointPackageCreate, PointPackageUpdate } from '../../../api/packages';

const AdminPackageManagementPage: React.FC = () => {
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await packagesApi.listAdmin();
      setPackages(res.data.data);
    } catch (err: any) {
      message.error('Không thể tải danh sách gói');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenModal = (packageToEdit?: PointPackage) => {
    if (packageToEdit) {
      setIsEditing(true);
      setCurrentPackageId(packageToEdit.id);
      form.setFieldsValue({
        ...packageToEdit,
        type: packageToEdit.type,
      });
    } else {
      setIsEditing(false);
      setCurrentPackageId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing && currentPackageId) {
        await packagesApi.update(currentPackageId, values as PointPackageUpdate);
        message.success('Cập nhật gói thành công');
      } else {
        await packagesApi.create(values as PointPackageCreate);
        message.success('Tạo gói thành công');
      }
      setIsModalVisible(false);
      fetchPackages();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await packagesApi.delete(id);
      message.success('Xóa gói thành công');
      fetchPackages();
    } catch (err: any) {
      message.error('Xóa thất bại');
    }
  };

  const columns = [
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'STANDARD' ? 'blue' : 'purple'}>{type}</Tag>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | undefined) => (price !== undefined ? `${price.toLocaleString()}đ` : '-'),
    },
    {
      title: 'Point',
      dataIndex: 'points',
      key: 'points',
      render: (points: number | undefined) => (points !== undefined ? `${points} points` : '-'),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'orange'}>{isActive ? 'Đang dùng' : 'Tắt'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: PointPackage) => (
        <Space>
          <Button size="small" onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa gói này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Quản lý các gói Point</h2>
        <Button type="primary" onClick={() => handleOpenModal()}>Thêm gói mới</Button>
      </div>
      <Table
        dataSource={packages}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={isEditing ? 'Chỉnh sửa gói' : 'Thêm gói mới'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên gói" rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Loại gói" rules={[{ required: true, message: 'Vui lòng chọn loại gói' }]}>
            <Select options={[{ value: 'STANDARD', label: 'Standard' }, { value: 'ENTERPRISE', label: 'Enterprise' }]} />
          </Form.Item>
          <Form.Item name="price" label="Giá (VNĐ)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="points" label="Số lượng Point">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
            <Select 
              options={[
                { value: true, label: 'Đang dùng' },
                { value: false, label: 'Tắt' }
              ]} 
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AdminPackageManagementPage;
