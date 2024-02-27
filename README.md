# postcss-fluid-sizing-function

[PostCSS](https://github.com/postcss/postcss) plugin to transform `fluid-sizing()` to an expression using `clamp()`, known as [fluid typography](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/).

```css
h1 {
  font-size: fluid-sizing(640px 2rem, 1440px 4rem);
}

.container {
  padding: fluid-sizing(640px 24px, 1440px 48px) fluid-sizing(640px 32px, 1440px 64px);
}
```

will be processed to:

```css
h1 {
  font-size: clamp(2rem, 4vw + 0.4rem, 4rem);
}

.container {
  padding: clamp(24px, 3vw + 4.8px, 48px) clamp(32px, 4vw + 6.4px, 64px);
}
```

Checkout [tests](test/basic.css) for more examples.

The `fluid-sizing(from-viewport-width from-size, to-viewport-width to-size)` function accepts four dimensions as two comma-separated pairs as its parameters.

- `from-viewport-width`: The starting viewport-width.
- `from-size`: The starting size. For narrower viewport-widths than `from-viewport-width`, the starting size is used.
- `to-viewport-width`: The ending viewport-width.
- `to-size`: The ending size. For wider viewport-widths than `to-viewport-width`, the ending size is used.

It supports `px` units and `rem` units, but `from-viewport-width` and `to-viewport-width` or `from-size` and `to-size` must each have the same units.

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-fluid-sizing-function
```

**Step 2:** Check you project for existed PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according to [official docs](https://github.com/postcss/postcss#usage)
and set this plugin in settings.

**Step 3:** Add the plugin to plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-fluid-sizing-function'),
    require('autoprefixer'),
  ],
}
```

## Options

### `viewportWidths`

Type: `{ [key: string]: string }`  
Default: `{}`

Defines the viewport-widths that can be referenced from `from-viewport-width` and `to-viewport-width` via those keys.

```js
require('postcss-fluid-sizing-function')({
  viewportWidths: {
    sm: '640px',
    lg: '1440px',
  },
});
```

Example:

```css
h1 {
  font-size: fluid-sizing(sm 2rem, lg 4rem);
  /* same as fluid-sizing(640px 2rem, 1440px 4rem) */
}
```

You can also define default values if viewport-widths is omitted by using `DEFAULT_FROM` or `DEFAULT_TO` as keys.

```js
require('postcss-fluid-sizing-function')({
  viewportWidths: {
    DEFAULT_FROM: '640px',
    DEFAULT_TO: '1440px',
  },
});
```

Example:

```css
h1 {
  font-size: fluid-sizing(2rem, 4rem);
  /* same as fluid-sizing(640px 2rem, 1440px 4rem) */
}
```

### `useLogicalUnits`

Type: `Boolean`  
Default: `false`

Allows you to use `vi` units instead of `vw` units for the output.

Example:

```css
h1 {
  font-size: fluid-sizing(640px 2rem, 1440px 4rem);
}
```

will be processed to:

```css
h1 {
  font-size: clamp(2rem, 4vi + 0.4rem, 4rem);
}
```

### `rootFontSize`

Type: `Number`  
Default: `16`

Allows you to set the `font-size` of the root used in the calculations for `rem` units.

### `precision`

Type: `Number`  
Default: `5`

Allows you to control the number of decimal places in the output numbers.
