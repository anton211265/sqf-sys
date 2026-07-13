const path = require('path');

module.exports = {
  plugins: {
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: { config: path.resolve(__dirname, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
