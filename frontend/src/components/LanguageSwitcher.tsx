import React from 'react';
import { Dropdown, Button, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const items = [
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🇬🇧</span>
          <span>{t('language.english')}</span>
          {currentLang === 'en' && <Text type="secondary" style={{ fontSize: 12 }}>(current)</Text>}
        </div>
      ),
      onClick: () => changeLanguage('en'),
    },
    {
      key: 'vi',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🇻🇳</span>
          <span>{t('language.vietnamese')}</span>
          {currentLang === 'vi' && <Text type="secondary" style={{ fontSize: 12 }}>(hiện tại)</Text>}
        </div>
      ),
      onClick: () => changeLanguage('vi'),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
      <Button
        type="text"
        icon={<GlobalOutlined />}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#595959',
          fontWeight: 500,
        }}
      >
        {currentLang === 'en' ? 'EN' : 'VI'}
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;
