import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, TeamOutlined, DashboardOutlined, DollarOutlined, FileOutlined, CarOutlined, VideoCameraOutlined, AppstoreOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const aiPaths = ['/admin/license-plate', '/admin/video-repair'];
  const [openKeys, setOpenKeys] = React.useState<string[]>(
    aiPaths.includes(location.pathname) ? ['ai'] : []
  );

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/users', icon: <TeamOutlined />, label: 'Tài khoản' },
    { key: '/admin/transactions', icon: <DollarOutlined />, label: 'Giao dịch' },
    { key: '/admin/packages', icon: <AppstoreOutlined />, label: 'Các gói' },
    { key: '/admin/files', icon: <FileOutlined />, label: 'File' },
    { key: '/admin/config', icon: <SettingOutlined />, label: 'Cấu hình' },
    { key: 'ai', icon: <CarOutlined />, label: 'AI Modules',
      children: [
        { key: '/admin/license-plate', icon: <CarOutlined />, label: 'Biển số' },
        { key: '/admin/video-repair', icon: <VideoCameraOutlined />, label: 'Sửa video' },
      ],
    },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ', onClick: () => navigate('/can-bo/profile') },
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
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
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

export default AdminLayout;
