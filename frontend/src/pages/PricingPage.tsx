import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Modal, Form, Input, message } from 'antd';
import { packagesApi } from '../api/packages';
import type { PointPackage } from '../api/packages';

const { Title, Text } = Typography;

const PricingPage: React.FC = () => {
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchPackages = async () => {
    const res = await packagesApi.list();
    setPackages(res.data.data);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleContactClick = (pkg: PointPackage) => {
    setSelectedPackage(pkg);
    setIsContactModalVisible(true);
  };

  const handleContactSubmit = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      await packagesApi.contactEnterprise({
        ...values,
        package_name: selectedPackage?.name,
      });
      message.success('Liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất.');
      setIsContactModalVisible(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.message || 'Gửi liên hệ thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title>Các gói dịch vụ</Title>
        <Text type="secondary">Chọn gói phù hợp nhất với nhu cầu của bạn</Text>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {packages.map((pkg) => (
          <Col xs={24} sm={12} md={8} key={pkg.id}>
            <Card
              hoverable
              style={{
                height: '100%',
                textAlign: 'center',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              actions={[
                pkg.type === 'STANDARD' ? (
                  <Button type="primary" block>Mua ngay</Button>
                ) : (
                  <Button onClick={() => handleContactClick(pkg)} block>Liên hệ tư vấn</Button>
                ),
              ]}
            >
              <div style={{ marginBottom: '16px' }}>
                <Title level={3} style={{ margin: 0 }}>{pkg.name}</Title>
                {pkg.type === 'STANDARD' && pkg.price && (
                  <Text type="danger" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {pkg.price.toLocaleString()}đ
                  </Text>
                )}
                {pkg.type === 'ENTERPRISE' && (
                  <Text type="secondary">Liên hệ để có giá tốt nhất</Text>
                )}
              </div>

              <div style={{ marginBottom: '24px', minHeight: '60px' }}>
                <Text>{pkg.description || 'Không có mô tả'}</Text>
              </div>

              {pkg.points !== undefined && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>{pkg.points} Points</Text>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="Liên hệ tư vấn Enterprise"
        open={isContactModalVisible}
        onOk={handleContactSubmit}
        onCancel={() => setIsContactModalVisible(false)}
        confirmLoading={submitting}
        okText="Gửi ngay"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleContactSubmit}>
          <Form.Item
            name="company_name"
            label="Tên doanh nghiệp"
            rules={[{ required: true, message: 'Vui lòng nhập tên doanh nghiệp' }]}
          >
            <Input placeholder="Công ty ABC" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email liên hệ"
            rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}
          >
            <Input placeholder="contact@company.com" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="090xxxxxxx" />
          </Form.Item>
          <Form.Item name="message" label="Nội dung cần tư vấn">
            <Input.TextArea rows={4} placeholder="Chúng tôi cần tư vấn về..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PricingPage;
