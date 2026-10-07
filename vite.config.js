import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The app is hosted inside another website under this sub-path.
  base: "/apps/tatbeqey/apps/ninja-learn-hub/",
});
