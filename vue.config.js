module.exports = {
  configureWebpack: {
    devtool: 'source-map',
  },
  pluginOptions: {
    electronBuilder: {
      removeElectronJunk: false,
      nodeIntegration: true,
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        extraResources: ['./extraResources/**'],
      },
    },
  },
}
