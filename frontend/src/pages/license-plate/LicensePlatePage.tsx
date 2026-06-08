import React, { useState } from 'react';
import { Card, Upload, Button, Typography, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { filesApi } from '../../api/files';
import WorkspaceLayout from './workspace/WorkspaceLayout';
import { WorkspaceProvider, useWorkspace } from './workspace/WorkspaceContext';

const { Title, Text } = Typography;

const LicensePlateUploader: React.FC = () => {
  const { setActiveFile, addFile } = useWorkspace();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (f: File) => {
    setUploading(true);
    try {
      const res = await filesApi.upload(f);
      const fileId = res.data.data.id;
      const url = URL.createObjectURL(f);
      const isVideo = f.type.startsWith('video/');
      
      const fileNode = {
        id: `file_${fileId}`,
        name: f.name,
        type: isVideo ? 'video' : 'image',
        url,
        fileId
      };
      
      addFile(fileNode as any);
      setActiveFile(fileNode as any);
      message.success('Tải file thành công!');
    } catch (err: any) {
      console.error('Upload Error:', err);
      message.error(`Tải file thất bại: ${err.response?.data?.detail?.message || err.message}`);
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100%' }}>
      <Title level={4}>Phục hồi biển số xe</Title>
      
      <Card title="Ảnh/Video đầu vào" style={{ maxWidth: 800, width: '100%', margin: '0 auto', marginTop: 40 }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Upload
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button icon={<UploadOutlined />} loading={uploading} size="large">
              Tải ảnh hoặc video
            </Button>
          </Upload>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Tải ảnh (JPG/PNG/WEBP) hoặc Video (MP4) tối đa 20 MB</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

const LicensePlatePageWrapper: React.FC = () => {
  const { activeFile } = useWorkspace();
  
  if (activeFile) {
    return <WorkspaceLayout />;
  }
  
  return <LicensePlateUploader />;
};

const LicensePlatePage: React.FC = () => {
  return (
    <WorkspaceProvider>
      <LicensePlatePageWrapper />
    </WorkspaceProvider>
  );
};

export default LicensePlatePage;

