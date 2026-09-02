import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.smartrecipeapp.app",
  appName: "SmartRecipe",
  webDir: "public",
  server: {
    url: "https://smartrecipeapp.com",
    cleartext: false,
  },
};

export default config;
