const path = require('path');

module.exports = {
  // Set the mode for development or production
  mode: 'development', // Change to 'production' for production builds

  entry: './src/browser-version.js', // Your main entry point

  output: {
    filename: 'bundle.js', // Output filename
    path: path.resolve(__dirname, 'dist'), // Output directory (optional)
  },

  module: {
    rules: [
      {
        test: /\.js$/, // Apply this rule to all JavaScript files
        exclude: /node_modules/, // Exclude node_modules folder
        use: {
          loader: 'babel-loader', // Use Babel loader for transpilation
          options: {
            presets: ['@babel/preset-env'], // Preset for modern JS features
          },
        },
      },
    ],
  },
};
