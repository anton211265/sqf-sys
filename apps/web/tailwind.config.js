// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ['./src/**/*.{html,js,ts}'],
//   theme: {
//     extend: {
//       colors: {
//         primary: '#243c5a',
//         inProgress: '#8EEDFA',
//       },
//     },
//   },
//   plugins: [],
// };

const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, 'src/**/*.{js,jsx,ts,tsx}')],
  theme: {
    extend: {
      colors: {
        addIcon: '#4D5C92',
        error: '#FA5252',
        gray: '#9095A1',
        offWhite: '#F3F6F9',
        lightGray: '#767680',
        main: '#04174B',
        gold: '#584400',
      },
      backgroundImage: {
        'gradient-main':
          'linear-gradient(180deg, #04174B 0%, rgba(4, 23, 75, 0.5) 100%)',
      },
    },
  },
  plugins: [require("tailwindcss/nesting")],
};
