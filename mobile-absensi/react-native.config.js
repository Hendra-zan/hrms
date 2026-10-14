const path = require('path');

module.exports = {

  dependencies: {

    // Keep Android native build stable on this workspace/device matrix.

    'react-native-screens': {

      platforms: {

        android: null,

      },

    },

    'react-native-nitro-image': {

      platforms: {

        android: {

          sourceDir: path.resolve(__dirname, 'node_modules/react-native-nitro-image/android'),

          packageImportPath: 'import com.margelo.nitro.image.NitroImagePackage;',

          packageInstance: 'new NitroImagePackage()',

        },

      },

    },

  },

};

