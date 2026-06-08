import React from 'react';
import { Typography, Grid } from 'antd';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div style={{ marginBottom: isMobile ? 12 : 16 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 8 : 16,
        }}
      >
        <div>
          <Title
            level={4}
            style={{
              margin: 0,
              fontSize: isMobile ? 18 : 20,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Title>
          {subtitle && (
            <Text
              type="secondary"
              style={{
                fontSize: 14,
                display: 'block',
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </div>

        {extra && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
