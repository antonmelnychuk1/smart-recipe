import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.smartrecipeapp.app",
  appName: "SmartRecipe",
  webDir: "public",
  server: {
    url: "https://smartrecipeapp.com",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: false,
      backgroundColor: "#f7f4ed",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#f7f4ed",
      overlaysWebView: false,
    },
  },
};

export default config;
