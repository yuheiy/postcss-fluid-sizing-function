import {
  isFunctionNode,
  isSimpleBlockNode,
  isTokenNode,
  parseCommaSeparatedListOfComponentValues,
  parseComponentValue,
  replaceComponentValues,
  type ComponentValue,
  type FunctionNode,
  type TokenNode,
} from '@csstools/css-parser-algorithms';
import { stringify, tokenize } from '@csstools/css-tokenizer';
import type { PluginCreator } from 'postcss';
import { solveFluidSizing } from './fluid-sizing.js';

const FLUID_SIZING_FUNCTION_REGEX = /\bfluid-sizing\(/i;
const FLUID_SIZING_NAME_REGEX = /^fluid-sizing$/i;

/** postcss-fluid-sizing-function plugin options */
export type pluginOptions = {
  /**
   * Defines the viewport-widths that can be referenced from `from-viewport-width` and
   * `to-viewport-width` via those keys.
   */
  viewportWidths?:
    | {
        [key: string]: string | undefined;
        DEFAULT_FROM?: string | undefined;
        DEFAULT_TO?: string | undefined;
      }
    | undefined;

  /**
   * Allows you to use `vi` units instead of `vw` units for the output.
   */
  useLogicalUnits?: boolean | undefined;

  /**
   * Allows you to set the `font-size` of the root used in the calculation for `rem` units.
   */
  rootFontSize?: number | undefined;

  /**
   * Allows you to control the number of decimal places in the output numbers.
   */
  precision?: number | undefined;
};

/** Transform fluid-sizing() functions in CSS. */
const creator: PluginCreator<pluginOptions> = (options_?: pluginOptions) => {
  const options = {
    viewportWidths: options_?.viewportWidths ?? {},
    useLogicalUnits: options_?.useLogicalUnits ?? false,
    rootFontSize: options_?.rootFontSize ?? 16,
    precision: options_?.precision ?? 5,
  } satisfies pluginOptions;

  function fluidSizing(fluidSizingNode: FunctionNode): ComponentValue | void {
    const relevantNodes: TokenNode[] = [];

    for (const node of fluidSizingNode.value) {
      if (isFunctionNode(node) || isSimpleBlockNode(node)) {
        return;
      }
      if (isTokenNode(node)) {
        relevantNodes.push(node);
      }
    }

    const separatedNodes = parseCommaSeparatedListOfComponentValues(
      relevantNodes.map(({ value }) => value),
    );

    if (
      !(
        separatedNodes.length === 2 &&
        separatedNodes.every((nodes) => nodes.length === 1 || nodes.length === 2)
      )
    ) {
      return;
    }

    const fromNodes: TokenNode[] = [];
    const toNodes: TokenNode[] = [];

    for (const [nodes, result, defaultViewportWidthValue] of [
      [
        separatedNodes[0] as [TokenNode] | [TokenNode, TokenNode],
        fromNodes,
        options.viewportWidths.DEFAULT_FROM,
      ],
      [
        separatedNodes[1] as [TokenNode] | [TokenNode, TokenNode],
        toNodes,
        options.viewportWidths.DEFAULT_TO,
      ],
    ] as const) {
      let viewportWidthNode: TokenNode | null;
      let sizeNode: TokenNode;

      switch (nodes.length) {
        case 2:
          [viewportWidthNode, sizeNode] = nodes as [TokenNode, TokenNode];
          break;

        case 1:
          viewportWidthNode = null;
          [sizeNode] = nodes as [TokenNode];
          break;

        default:
          return;
      }

      if (viewportWidthNode != null) {
        const maybeViewportWidthKey = viewportWidthNode.value[1];
        const viewportWidthValueForKey = options.viewportWidths[maybeViewportWidthKey];
        if (viewportWidthValueForKey != null) {
          const viewportWidthNodeForKey = parseComponentValue(
            tokenize({ css: viewportWidthValueForKey }),
          );
          if (!isTokenNode(viewportWidthNodeForKey)) {
            return;
          }
          viewportWidthNode = viewportWidthNodeForKey;
        }
      } else {
        if (defaultViewportWidthValue == null) {
          return;
        }
        const defaultViewportWidthNode = parseComponentValue(
          tokenize({ css: defaultViewportWidthValue }),
        );
        if (!isTokenNode(defaultViewportWidthNode)) {
          return;
        }
        viewportWidthNode = defaultViewportWidthNode;
      }

      result.push(viewportWidthNode, sizeNode);
    }

    return solveFluidSizing(fromNodes[0]!, fromNodes[1]!, toNodes[0]!, toNodes[1]!, {
      useLogicalUnits: options.useLogicalUnits,
      rootFontSize: options.rootFontSize,
      precision: options.precision,
    });
  }

  return {
    postcssPlugin: 'postcss-fluid-sizing-function',
    Declaration(decl) {
      const originalValue = decl.value;
      if (!FLUID_SIZING_FUNCTION_REGEX.test(originalValue)) {
        return;
      }

      const modifiedValue = replaceComponentValues(
        parseCommaSeparatedListOfComponentValues(tokenize({ css: originalValue })),
        (componentValue) => {
          if (
            !isFunctionNode(componentValue) ||
            !FLUID_SIZING_NAME_REGEX.test(componentValue.getName())
          ) {
            return;
          }

          return fluidSizing(componentValue);
        },
      )
        .map((componentValues) => componentValues.map((x) => stringify(...x.tokens())).join(''))
        .join(',');

      if (modifiedValue === originalValue) {
        return;
      }

      decl.value = modifiedValue;
    },
  };
};

creator.postcss = true;

export default creator;
