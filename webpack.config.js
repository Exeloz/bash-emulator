const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  // Set the mode for development or production
  mode: 'production', // Recommended for production builds, adjust for development

  // Entry point for your application
  entry: './src/browser-version.js',

  // Output configuration for the bundled file
  output: {
    filename: 'bundle.min.js', // Output filename
    path: path.resolve(__dirname, 'dist'), // Output directory
  },

  // Module loaders for processing different file types
  module: {
    rules: [
      {
        // Transpile JavaScript files with Babel
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'], // Preset for modern JS features
          },
        },
      },
      // Add rules for other file types like CSS, images, etc. (optional)
    ],
  },

  // Optimization options for production builds
  optimization: {
    minimize: true, // Enable minification
    minimizer: [
        new TerserPlugin(),
    ],
  },
};
