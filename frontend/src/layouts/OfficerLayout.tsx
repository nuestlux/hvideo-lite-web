import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Drawer, Button, Grid, Select, Space } from 'antd';
import { UserOutlined, LogoutOutlined, DashboardOutlined, DollarOutlined, FileOutlined, CarOutlined, VideoCameraOutlined, MenuOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getFullUrl } from '../utils/url';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const OfficerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const aiPaths = ['/can-bo/license-plate', '/can-bo/video-repair'];
  const [openKeys, setOpenKeys] = React.useState<string[]>(
    aiPaths.includes(location.pathname) ? ['ai'] : []
  );

  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: '/can-bo', icon: <DashboardOutlined />, label: t('menu.dashboard') },
    {
      key: 'ai',
      icon: <CarOutlined />,
      label: t('menu.aiModules'),
      children: [
        { key: '/can-bo/license-plate', icon: <CarOutlined />, label: t('menu.licensePlate') },
        { key: '/can-bo/video-repair', icon: <VideoCameraOutlined />, label: t('menu.videoRepair') },
      ],
    },
    { key: '/can-bo/transactions', icon: <DollarOutlined />, label: t('menu.transactions') },
    { key: '/can-bo/files', icon: <FileOutlined />, label: t('menu.files') },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'profile') {
      navigate('/can-bo/profile');
    } else if (key === 'logout') {
      logout();
    }
  };

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: t('menu.profile') },
      { key: 'logout', icon: <LogoutOutlined />, label: t('auth.logout') },
    ],
    onClick: handleUserMenuClick,
  };

  const siderContent = (
    <>
      <div 
        style={{ 
          padding: collapsed ? '16px 0' : '12px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}favicon.svg`} 
          alt="Hvideo Lite" 
          style={{ width: 32, height: 32 }} 
        />
        {!collapsed && (
          <Text strong style={{ color: '#fff', fontSize: 16, marginLeft: 10 }}>
            Hvideo Lite
          </Text>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        onClick={({ key }) => { navigate(key); if (isMobile) setDrawerOpen(false); }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider 
          collapsible 
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={220}
          collapsedWidth={70}
          style={{ 
            overflow: 'auto',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
          }}
        >
          {siderContent}
        </Sider>
      )}
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ color: '#000' }}
            />
          )}
          <div style={{ flex: 1 }} />
          <Space align="center" style={{ marginRight: 12 }}>
            <Select
              value={currentLang}
              onChange={handleLanguageChange}
              style={{ width: 130 }}
              bordered={false}
              options={[
                { value: 'en', label: <>🇬🇧 English</> },
                { value: 'vi', label: <>🇻🇳 Tiếng Việt</> },
              ]}
            />
          </Space>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar src={getFullUrl(user?.avatar_url)} icon={<UserOutlined />} />
              <Text>{user?.name}</Text>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: isMobile ? 12 : 24 }}>
          <Outlet />
        </Content>
      </Layout>

      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={240}
          styles={{ body: { padding: 0, background: '#001529' } }}
        >
          {siderContent}
        </Drawer>
      )}
    </Layout>
  );
};

export default OfficerLayout;
