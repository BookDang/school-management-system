'use client';

import { ConfigProvider } from 'antd';

// Mirrors the design system palette in app/globals.css (`--color-<family>-500`) - antd's own
// components (Button, Input, Menu...) read theme tokens through ConfigProvider, not Tailwind
// classes, so the two need to be kept in sync by hand when the palette changes.
const theme = {
  token: {
    colorPrimary: '#0066cf',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#0ea5e9',
  },
  components: {
    // Sidebar nav items mark themselves with color alone (no filled background pill), in any
    // state - matching AdminSidebar's dark rail. AdminSidebar's Menu uses `theme="dark"`, which
    // reads the `dark*`-prefixed tokens below instead of the plain (light-theme) ones - applies
    // globally since only that Menu currently uses `theme="dark"`.
    Menu: {
      darkItemColor: '#ffffff',
      darkItemSelectedBg: 'transparent',
      // Selected and hover both use Primary shades (distinct from each other and from the white
      // resting color) so the active page is visually distinguishable from an item being hovered.
      darkItemSelectedColor: '#3385ff',
      darkItemHoverBg: 'transparent',
      darkItemHoverColor: '#66a3ff',
    },
  },
};

const AntdThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider theme={theme}>{children}</ConfigProvider>
);

export default AntdThemeProvider;
