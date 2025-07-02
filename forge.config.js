/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    icon: 'src/assets/favicon',
    name: 'pos-venda', // Adicione esta linha para garantir nome curto
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'DiomarGoncalves',
          name: 'pos-venda-cimasp',
        },
        prerelease: false,
        draft: false,
      },
    },
  ],
};
