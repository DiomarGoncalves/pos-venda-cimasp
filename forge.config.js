/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    icon: 'src/assets/favicon',
    name: 'pos-venda', // Adicione esta linha para garantir nome curto
    extraResource: [
      'app-update.yml'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'pos-venda'
      },
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
        prerelease: false, // false para releases estáveis
        draft: true, // true para criar rascunho e publicar manualmente depois
        generateReleaseNotes: true,
      },
    },
  ],
};
