import {
  parseComponentValue,
  type ComponentValue,
  type TokenNode,
} from '@csstools/css-parser-algorithms';
import { TokenType, tokenize, type CSSToken, type TokenDimension } from '@csstools/css-tokenizer';

function isValidDimension(x: CSSToken): x is TokenDimension {
  return x[0] === TokenType.Dimension && (x[4].unit === 'px' || x[4].unit === 'rem');
}

function toPrecision(n: number, precision: number): number {
  return Number(n.toFixed(precision));
}

export function solveFluidSizing(
  fromViewportWidth: TokenNode,
  fromSize: TokenNode,
  toViewportWidth: TokenNode,
  toSize: TokenNode,
  options: {
    useLogicalUnits: boolean;
    rootFontSize: number;
    precision: number;
  },
): ComponentValue | void {
  const fromViewportWidthToken = fromViewportWidth.value;
  const fromSizeToken = fromSize.value;
  const toViewportWidthToken = toViewportWidth.value;
  const toSizeToken = toSize.value;

  if (
    !isValidDimension(fromViewportWidthToken) ||
    !isValidDimension(fromSizeToken) ||
    !isValidDimension(toViewportWidthToken) ||
    !isValidDimension(toSizeToken)
  ) {
    return;
  }

  if (fromViewportWidthToken[4].value <= 0 || toViewportWidthToken[4].value <= 0) {
    return;
  }

  if (
    fromViewportWidthToken[4].unit !== toViewportWidthToken[4].unit ||
    fromSizeToken[4].unit !== toSizeToken[4].unit
  ) {
    return;
  }

  if (fromSizeToken[4].value === toSizeToken[4].value) {
    return fromSize;
  }

  if (fromViewportWidthToken[4].value === toViewportWidthToken[4].value) {
    return;
  }

  const withUnit =
    fromSizeToken[4].unit === 'px'
      ? (value: number) => `${toPrecision(value, options.precision)}px`
      : (value: number) => `${toPrecision(value / options.rootFontSize, options.precision)}rem`;

  const [fromViewportWidthValue, fromSizeValue, toViewportWidthValue, toSizeValue] = [
    fromViewportWidthToken,
    fromSizeToken,
    toViewportWidthToken,
    toSizeToken,
  ].map((x) => (x[4].unit === 'rem' ? x[4].value * options.rootFontSize : x[4].value)) as [
    number,
    number,
    number,
    number,
  ];

  const v = (100 * (toSizeValue - fromSizeValue)) / (toViewportWidthValue - fromViewportWidthValue);
  const r =
    (fromViewportWidthValue * toSizeValue - toViewportWidthValue * fromSizeValue) /
    (fromViewportWidthValue - toViewportWidthValue);

  let central = `${toPrecision(v, options.precision)}${options.useLogicalUnits ? 'vi' : 'vw'}`;
  if (r !== 0) {
    central += ` ${Math.sign(r) >= 0 ? '+' : '-'} ${withUnit(Math.abs(r))}`;
  }

  const minimumValue = Math.min(fromSizeValue, toSizeValue);
  const maximumValue = Math.max(fromSizeValue, toSizeValue);

  return parseComponentValue(
    tokenize({
      css: `clamp(${[withUnit(minimumValue), central, withUnit(maximumValue)].join(', ')})`,
    }),
  );
}
