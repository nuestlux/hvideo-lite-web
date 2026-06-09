import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Drawer, Button, Grid } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, TeamOutlined, DashboardOutlined, DollarOutlined, FileOutlined, CarOutlined, VideoCameraOutlined, AppstoreOutlined, MenuOutlined, GlobalOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getFullUrl } from '../utils/url';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const aiPaths = ['/admin/license-plate', '/admin/video-repair'];
  const [openKeys, setOpenKeys] = React.useState<string[]>(
    aiPaths.includes(location.pathname) ? ['ai'] : []
  );

  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: t('menu.dashboard') },
    {
      key: 'ai',
      icon: <CarOutlined />,
      label: t('menu.aiModules'),
      children: [
        { key: '/admin/license-plate', icon: <CarOutlined />, label: t('menu.licensePlate') },
        { key: '/admin/video-repair', icon: <VideoCameraOutlined />, label: t('menu.videoRepair') },
      ],
    },
    { key: '/admin/users', icon: <TeamOutlined />, label: t('menu.users') },
    { key: '/admin/transactions', icon: <DollarOutlined />, label: t('menu.transactions') },
    { key: '/admin/packages', icon: <AppstoreOutlined />, label: t('menu.packages') },
    { key: '/admin/files', icon: <FileOutlined />, label: t('menu.files') },
    { key: '/admin/config', icon: <SettingOutlined />, label: t('menu.config') },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'profile') {
      navigate('/admin/profile');
    } else if (key === 'logout') {
      logout();
    } else if (key === 'lang-en') {
      i18n.changeLanguage('en');
    } else if (key === 'lang-vi') {
      i18n.changeLanguage('vi');
    }
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: t('menu.profile') },
      {
        key: 'language',
        icon: <GlobalOutlined />,
        label: t('language.switch'),
        children: [
          {
            key: 'lang-en',
            label: (
              <span>
                🇬🇧 {t('language.english')}
                {currentLang === 'en' && ' ✓'}
              </span>
            ),
          },
          {
            key: 'lang-vi',
            label: (
              <span>
                🇻🇳 {t('language.vietnamese')}
                {currentLang === 'vi' && ' ✓'}
              </span>
            ),
          },
        ],
      },
      { key: 'logout', icon: <LogoutOutlined />, label: t('auth.logout') },
    ],
    onClick: handleUserMenuClick,
  };

  const siderContent = (
    <>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" style={{ width: 28, height: 28 }} />
        <Text strong style={{ color: '#fff', fontSize: 16 }}>Hvideo Lite</Text>
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
        <Sider collapsible>
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

export default AdminLayout;
