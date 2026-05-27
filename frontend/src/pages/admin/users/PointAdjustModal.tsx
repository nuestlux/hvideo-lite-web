import React, { useState } from 'react';
import { Modal, Form, InputNumber, Input, Typography, message, Select } from 'antd';
const { Text } = Typography;
import { pointsApi } from '../../../api/points';

interface Props {
  open: boolean;
  user: { id: number; name: string; points: number } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PointAdjustModal: React.FC<Props> = ({ open, user, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { action: 'add' | 'subtract'; amount: number; reason: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      const point = values.action === 'add' ? values.amount : -values.amount;
      await pointsApi.adjust(user.id, { point, reason: values.reason });
      message.success('Điều chỉnh point thành công');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Điều chỉnh thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Điều chỉnh Point: ${user?.name || ''}`}
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Text>Số dư hiện tại: <Text strong>{user?.points ?? 0}</Text></Text>
      </div>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={<><Text strong>Hành động</Text> <Text type="danger">*</Text></>}
          name="action"
          initialValue="add"
          rules={[{ required: true, message: 'Chọn hành động' }]}
        >
          <Select
            options={[
              { value: 'add', label: 'Cộng point' },
              { value: 'subtract', label: 'Trừ point' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={<><Text strong>Số point</Text> <Text type="danger">*</Text></>}
          name="amount"
          rules={[{ required: true, message: 'Nhập số point' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="Nhập số point" />
        </Form.Item>
        <Form.Item
          label={<><Text strong>Lý do</Text> <Text type="danger">*</Text></>}
          name="reason"
          rules={[{ required: true, message: 'Lý do là bắt buộc' }]}
        >
          <Input.TextArea rows={3} placeholder="Nhập lý do điều chỉnh..." />
        </Form.Item>
        <Form.Item>
          <button className="ant-btn ant-btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PointAdjustModal;
