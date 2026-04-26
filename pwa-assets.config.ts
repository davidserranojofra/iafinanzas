import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    appleSplashScreens: {
      padding: 0.3,
      resizeOptions: {
        background: '#282a36',
        fit: 'contain',
      },
      linkMediaOptions: {
        log: true,
        addMediaScreen: true,
        basePath: '/',
        xhtml: false,
      },
      sizes: [
        { width: 640,  height: 1136, scaleFactor: 2 },  // iPhone SE 1ª gen
        { width: 750,  height: 1334, scaleFactor: 2 },  // iPhone SE 2/3, 8
        { width: 1242, height: 2208, scaleFactor: 3 },  // iPhone 8 Plus
        { width: 1125, height: 2436, scaleFactor: 3 },  // iPhone X, XS, 11 Pro
        { width: 1242, height: 2688, scaleFactor: 3 },  // iPhone XS Max, 11 Pro Max
        { width: 828,  height: 1792, scaleFactor: 2 },  // iPhone XR, 11
        { width: 1080, height: 2340, scaleFactor: 3 },  // iPhone 12 mini, 13 mini
        { width: 1170, height: 2532, scaleFactor: 3 },  // iPhone 12, 13, 14
        { width: 1284, height: 2778, scaleFactor: 3 },  // iPhone 12/13 Pro Max, 14 Plus
        { width: 1179, height: 2556, scaleFactor: 3 },  // iPhone 14 Pro, 15, 15 Pro
        { width: 1290, height: 2796, scaleFactor: 3 },  // iPhone 14 Pro Max, 15 Plus, 15 Pro Max
        { width: 1206, height: 2622, scaleFactor: 3 },  // iPhone 16, 16 Pro
        { width: 1320, height: 2868, scaleFactor: 3 },  // iPhone 16 Plus, 16 Pro Max
      ],
    },
  },
  images: ['public/logo_IAFianza.png'],
})
