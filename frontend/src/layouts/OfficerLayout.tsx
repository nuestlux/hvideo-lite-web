import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, DollarOutlined, FileOutlined, CarOutlined, VideoCameraOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const OfficerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { key: '/can-bo', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/can-bo/license-plate', icon: <CarOutlined />, label: 'Biển số' },
    { key: '/can-bo/video-repair', icon: <VideoCameraOutlined />, label: 'Sửa video' },
    { key: '/can-bo/transactions', icon: <DollarOutlined />, label: 'Giao dịch' },
    { key: '/pricing', icon: <AppstoreOutlined />, label: 'Mua Point' },
    { key: '/can-bo/files', icon: <FileOutlined />, label: 'File' },
    { key: '/can-bo/profile', icon: <UserOutlined />, label: 'Hồ sơ' },
  ];

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: logout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ padding: '16px', color: '#fff', textAlign: 'center' }}>
          <Text strong style={{ color: '#fff', fontSize: 16 }}>Hvideo Lite</Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.name}</Text>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default OfficerLayout;
