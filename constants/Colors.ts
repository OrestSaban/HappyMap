const tintColorLight = '#FF4B4B';
const tintColorDark = '#FF4B4B';

// HappyMap Palette
// Primary: Vibrant Red/Pink for main actions
// Secondary: Gold/Yellow for highlights
// Accent: Blue for navigation/info
export default {
  light: {
    text: '#2D3436',
    textLight: '#636E72',
    background: '#FAFAFA',
    card: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: '#FF4B4B',
    secondary: '#FFD700',
    accent: '#4B69FF',
    success: '#00C851',
    danger: '#FF4444',
  },
  dark: {
    text: '#DFE6E9',
    textLight: '#B2BEC3',
    background: '#1F1F1F',
    card: '#2D2D2D',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: '#FF6B6B',
    secondary: '#FFEAA7',
    accent: '#74B9FF',
    success: '#00C851',
    danger: '#FF4444',
  },
};
