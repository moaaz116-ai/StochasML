/** Base URL for the REST API. */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** Base URL for the WebSocket connection. */
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

/** Application display name. */
export const APP_NAME = 'Stochas ML';

/** Application tagline / description. */
export const APP_DESCRIPTION = 'Open-Source TinyML Platform';

/** Maximum upload file size in bytes (100 MB). */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Supported audio file extensions. */
export const SUPPORTED_AUDIO_FORMATS = ['.wav', '.mp3', '.flac'] as const;

/** Supported image file extensions. */
export const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp'] as const;

/** Supported sensor data file extensions. */
export const SUPPORTED_SENSOR_FORMATS = ['.csv', '.json'] as const;

/** Sidebar navigation items. */
export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Projects', href: '/projects', icon: 'FolderKanban' },
  { label: 'Datasets', href: '/datasets', icon: 'Database' },
  { label: 'Training', href: '/training', icon: 'BrainCircuit' },
  { label: 'Models', href: '/models', icon: 'Boxes' },
  { label: 'Deployments', href: '/deployments', icon: 'Rocket' },
  { label: 'Device Lab', href: '/device-lab', icon: 'Cpu' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;
