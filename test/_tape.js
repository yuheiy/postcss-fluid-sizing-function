import { postcssTape } from '@csstools/postcss-tape';
import plugin from 'postcss-fluid-sizing-function';

const viewportWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
};

postcssTape(plugin)({
  basic: {
    message: 'supports basic usage',
    options: {
      viewportWidths: {
        ...viewportWidths,
        DEFAULT_FROM: viewportWidths.sm,
        DEFAULT_TO: viewportWidths['2xl'],
      },
    },
  },
  'root-font-size': {
    message: "change 'rootFontSize'",
    options: {
      rootFontSize: 10,
    },
  },
});
