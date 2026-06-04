import React, { createContext, useContext, useState } from 'react';

export type FileNode = {
  id: string;
  name: string;
  type: 'video' | 'image' | 'frame';
  url: string;
  thumbnail?: string;
  fileId?: number;
  duration?: string; // for videos
  size?: string;
  timestamp?: string;
};

interface WorkspaceState {
  activeFile: FileNode | null;
  setActiveFile: (f: FileNode | null) => void;
  files: FileNode[];
  addFile: (f: FileNode) => void;
  removeFile: (id: string) => void;

  activeTool: string;
  setActiveTool: (tool: string) => void;

  brightness: number;
  setBrightness: (val: number) => void;
  contrast: number;
  setContrast: (val: number) => void;
  sharpness: number;
  setSharpness: (val: number) => void;
  noiseReduction: number;
  setNoiseReduction: (val: number) => void;
  saturation: number;
  setSaturation: (val: number) => void;
  zoom: number;
  setZoom: (val: number) => void;

  resetAdjustments: () => void;
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

// ─── Rich mock data ──────────────────────────────────────────────────────────
const MOCK_FILES: FileNode[] = [
  {
    id: 'mock_img_1',
    name: 'camera_01_frame_142.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1280&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=160&q=60',
    fileId: 1001,
    size: '1.4 MB',
    timestamp: '00:02:22',
  },
  {
    id: 'mock_img_2',
    name: 'camera_02_frame_089.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1280&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=160&q=60',
    fileId: 1002,
    size: '2.1 MB',
    timestamp: '00:01:29',
  },
  {
    id: 'mock_img_3',
    name: 'cam_hanoi_013.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1280&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=160&q=60',
    fileId: 1003,
    size: '980 KB',
    timestamp: '00:00:45',
  },
  {
    id: 'mock_video_1',
    name: 'giao_lo_tran_duy_hung.mp4',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=160&q=60',
    fileId: 2001,
    duration: '0:32',
    size: '8.7 MB',
  },
  {
    id: 'mock_video_2',
    name: 'highway_cam_south.mp4',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=160&q=60',
    fileId: 2002,
    duration: '9:57',
    size: '158 MB',
  },
];

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFile, setActiveFile] = useState<FileNode | null>(MOCK_FILES[0]);
  const [files, setFiles] = useState<FileNode[]>(MOCK_FILES);
  const [activeTool, setActiveTool] = useState('select');

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [noiseReduction, setNoiseReduction] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [zoom, setZoom] = useState(100);

  const addFile = (f: FileNode) => setFiles((prev) => [...prev, f]);
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFile?.id === id) setActiveFile(null);
  };

  const resetAdjustments = () => {
    setBrightness(0);
    setContrast(0);
    setSharpness(0);
    setNoiseReduction(0);
    setSaturation(0);
    setZoom(100);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeFile, setActiveFile,
        files, addFile, removeFile,
        activeTool, setActiveTool,
        brightness, setBrightness,
        contrast, setContrast,
        sharpness, setSharpness,
        noiseReduction, setNoiseReduction,
        saturation, setSaturation,
        zoom, setZoom,
        resetAdjustments,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
};
