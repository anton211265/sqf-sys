const CopyWebpackPlugin = require('copy-webpack-plugin');
const glob = require('glob');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const PROJECT_NAME = 'risk-operation';
const ISSCRIPT = process.env.ISSCRIPT;
const ISDEVELOPMENT = process.env.NODE_ENV === 'development';

const externals = [
  nodeExternals({
    modulesDir: path.resolve(__dirname, '../../node_modules'),
  }),
  nodeExternals({
    modulesDir: path.resolve(__dirname, 'node_modules'),
  }),
];

const copyNodeModulesInDevelopment =
  ISDEVELOPMENT &&
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'node_modules'),
        to: path.resolve(
          __dirname,
          `../../dist/apps/${PROJECT_NAME}/node_modules`,
        ),
        noErrorOnMissing: true,
      },
    ],
  });

const scriptConfig = {
  entry: glob
    .sync('./src/scripts/**/*.ts', { cwd: __dirname })
    .reduce(function (obj, el) {
      obj[path.parse(el).name] = path.resolve(__dirname, el);
      return obj;
    }, {}),
  output: {
    path: path.resolve(__dirname, `../../dist/apps/${PROJECT_NAME}/scripts`),
    filename: '[name].js',
  },
  target: 'node',
  mode: 'development',
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.app.json'),
              onlyCompileBundledFiles: true,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, 'tsconfig.app.json'),
      }),
    ],
  },
};

module.exports = function (config) {
  if (!ISSCRIPT) {
    return {
      ...config,
      externals,
      plugins: [...(config?.plugins ?? []), copyNodeModulesInDevelopment],
    };
  }

  return {
    entry: { ...config.entry, ...scriptConfig.entry },
    output: {
      ...config.output,
      ...scriptConfig.output,
    },
    target: scriptConfig.target,
    mode: scriptConfig.mode,
    module: {
      ...config.module,
      ...scriptConfig.module,
      rules: [...(config?.module?.rules ?? []), ...scriptConfig.module.rules],
    },
    externals,
    plugins: [...(config?.plugins ?? []), copyNodeModulesInDevelopment],
    resolve: {
      ...config.resolve,
      ...scriptConfig.resolve,
      extensions: [
        ...(config?.resolve?.extensions ?? []),
        ...scriptConfig.resolve.extensions,
      ],
      plugins: [
        ...(config?.resolve?.plugins ?? []),
        ...scriptConfig.resolve.plugins,
      ],
    },
  };
};
