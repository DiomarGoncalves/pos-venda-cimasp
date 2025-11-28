/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    icon: 'src/assets/favicon',
    name: 'pos-venda',
    ignore: [
      /^\/out/,
      /^\/\.git/,
      /^\/\.vscode/,
      /^\/src/, // Vite builds to dist, so src is not needed in prod
      /^\/node_modules\/\.bin/,
      /\.exe$/,
      /\.zip$/,
    ],
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
};
