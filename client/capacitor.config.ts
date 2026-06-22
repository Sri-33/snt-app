import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.srinandhinitex.app',
  appName: 'SNT',
  webDir: 'dist',
  server: {
    url: 'https://app.srinandhinitex.com',
    cleartext: false,
  },
};

export default config;
