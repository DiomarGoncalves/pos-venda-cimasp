// Electron builder config
export default {
  appId: 'com.technical.service.management',
  productName: 'Controle de Pós-venda Técnico',
  directories: {
    output: 'release/'
  },
  files: [
    'dist/**/*',
    'electron/**/*'
  ],
  mac: {
    icon: 'src/assets/logo.png',
    category: 'public.app-category.business'
  },
  win: {
    icon: 'src/assets/logo.png',
    target: ['nsis']
  },
  linux: {
    icon: 'src/assets/logo.png',
    target: ['AppImage'],
    category: 'Office'
  }
};