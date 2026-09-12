import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';

function copyStaticAssetsPlugin() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const filesToCopy = [
        'manifest.json',
        'sw.js',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'apple-touch-icon.png',
        'favicon.png',
        'favicon.ico'
      ];

      for (const file of filesToCopy) {
        if (fs.existsSync(file)) {
          fs.copyFileSync(file, resolve(__dirname, 'dist', file));
        }
      }

      // Ensure css and js folders are copied
      const copyDir = (src, dest) => {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = resolve(src, entry.name);
          const destPath = resolve(dest, entry.name);
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      if (fs.existsSync('css')) copyDir('css', resolve(__dirname, 'dist', 'css'));
      if (fs.existsSync('js')) copyDir('js', resolve(__dirname, 'dist', 'js'));

      console.log('Successfully copied all Relas Couture static assets into dist/');
    }
  };
}

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        measurements: resolve(__dirname, 'measurements.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  },
  plugins: [
    copyStaticAssetsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],
      manifest: {
        name: 'ريلاس | بوتيك فساتين السهرة والزفاف',
        short_name: 'ريلاس',
        description: 'دار ريلاس للأزياء الراقية - تشكيلات حصرية من فساتين الزفاف والسهرة وتفصيل الهوت كوتور بالطلب مع استوديو أخذ القياسات الذكي.',
        theme_color: '#141414',
        background_color: '#FAF8F5',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'ar',
        scope: './',
        start_url: './index.html',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}']
      }
    })
  ]
});
