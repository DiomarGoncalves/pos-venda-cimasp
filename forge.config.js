/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    icon: 'src/assets/favicon',
    name: 'pos-venda',
    ignore: [
      // Build outputs
      /^\/out/,
      /^\/dist-electron/,

      // Source files (Vite builds to dist)
      /^\/src/,

      // Version control
      /^\/\.git/,
      /^\/\.gitignore/,
      /^\/\.gitattributes/,

      // IDE/Editor
      /^\/\.vscode/,
      /^\/\.idea/,

      // Cache and temp files
      /^\/\.vite/,
      /^\/node_modules\/\.cache/,
      /^\/node_modules\/\.bin/,

      // Config files not needed in production
      /^\/tsconfig/,
      /^\/vite\.config/,
      /^\/tailwind\.config/,
      /^\/postcss\.config/,
      /^\/eslint\.config/,
      /^\/forge\.config/,

      // Documentation
      /^\/README/,

      // Executables and archives (avoid including old builds)
      /\.exe$/,
      /\.zip$/,
      /\.msi$/,
      /\.dmg$/,
      /\.AppImage$/,
      /\.deb$/,
      /\.rpm$/,

      // Logs
      /\.log$/,
      /^\/logs/,

      // OS files
      /\.DS_Store$/,
      /Thumbs\.db$/,
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
