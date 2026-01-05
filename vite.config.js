import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    // SECURITY: We do NOT inject API keys into the client bundle
    // Users provide their own API keys via Settings modal (stored in localStorage)
    // Development keys from .env are accessed via import.meta.env.VITE_* prefix only
});
