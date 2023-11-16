import { stringifyProcessEnvs } from '@storybook/core-common';
import { build } from 'esbuild';
import { join } from 'path';
import type { Plugin } from 'rollup';
import { getNodeModuleDir } from './get-node-module-dir';

export const PREBUNDLED_MODULES_DIR = 'node_modules/.prebundled_modules';

export function rollupPluginPrebundleModules(env: Record<string, string>): Plugin {
  const modulePaths: Record<string, string> = {};

  return {
    name: 'rollup-plugin-prebundle-modules',

    async buildStart() {
      const esbuildCommonjsPlugin = (await import('@chialab/esbuild-plugin-commonjs')).default; // for CJS compatibility

      const modules = getModules();

      for (const module of modules) {
        modulePaths[module] = join(
          process.cwd(),
          PREBUNDLED_MODULES_DIR,
          module.endsWith('.js') ? module : `${module}.js`,
        );
      }

      await build({
        entryPoints: modules,
        outdir: PREBUNDLED_MODULES_DIR,
        bundle: true,
        format: 'esm',
        splitting: true,
        sourcemap: true,
        alias: {
          assert: require.resolve('browser-assert'),
          lodash: getNodeModuleDir('lodash-es'), // more optimal, but also solves esbuild incorrectly compiling lodash/_nodeUtil
          path: require.resolve('path-browserify'),
        },
        define: {
          ...stringifyProcessEnvs(env),
        },
        plugins: [esbuildCommonjsPlugin()],
      });
    },

    async resolveId(source) {
      return modulePaths[source];
    },
  };
}

function getModules() {
  const include = CANDIDATES.filter(id => {
    try {
      require.resolve(id, { paths: [process.cwd()] });
      return true;
    } catch (e) {
      return false;
    }
  });
  return include;
}

// this is different to https://github.com/storybookjs/storybook/blob/v7.0.0/code/lib/builder-vite/src/optimizeDeps.ts#L7
// builder-vite bundles different dependencies for performance reasons
// we aim only at browserifying NodeJS dependencies (CommonJS/process.env/...)
export const CANDIDATES = [
  // @testing-library has ESM, but imports/exports are not working correctly between packages
  // specifically "@testing-library/user-event" has "dist/esm/utils/misc/getWindow.js" (see https://cdn.jsdelivr.net/npm/@testing-library/user-event@14.4.3/dist/esm/utils/misc/getWindow.js)
  // which uses "@testing-library/dom" in `import { getWindowFromNode } from '@testing-library/dom/dist/helpers.js';`
  // which doesn't get resolved to "@testing-library/dom" ESM "dom.esm.js" (see https://cdn.jsdelivr.net/npm/@testing-library/dom@9.3.1/dist/@testing-library/dom.esm.js)
  // and instead gets resolved to "@testing-library/dom" CommonJS "dist/helpers.js" (see https://cdn.jsdelivr.net/npm/@testing-library/dom@9.3.1/dist/helpers.js)
  '@testing-library/dom',
  '@testing-library/user-event',

  // CommonJS module used in Storybook MJS files
  'doctrine',

  // CommonJS module used in Storybook MJS files
  'jest-mock',

  // CommonJS module used in Storybook MJS files
  'lodash/mapValues.js',

  // ESM, but uses `process.env.NODE_ENV`
  'tiny-invariant',
  /**
     * dependency of '@storybook/react-dom-shim' (https://cdn.jsdelivr.net/npm/@storybook/react-dom-shim@7.5.1/dist/react-16.mjs)
     * exports rely on commonjs: https://cdn.jsdelivr.net/npm/react-dom@18.2.0/index.js
     */ 
  'react-dom',
  /**
   * dependency of '@storybook/theming' (https://cdn.jsdelivr.net/npm/@storybook/theming@7.5.1/dist/index.mjs) 
   * `import * as React from 'react';
   * import { forwardRef, useContext } from 'react';`
   * exports rely on commonjs: https://cdn.jsdelivr.net/npm/react@18.2.0/index.js
   */
  'react',
  /**
   * dependency of '@storybook/theming' (https://cdn.jsdelivr.net/npm/@storybook/theming@7.5.1/dist/index.mjs)
   * `import memoize2 from 'memoizerific';`
   * exports rely on commonjs: https://cdn.jsdelivr.net/npm/memoizerific@1.11.3/src/memoizerific.js
   */
  'memoizerific',
  /**
   * dependencies of '@storybook/blocks' (https://cdn.jsdelivr.net/npm/@storybook/blocks@7.5.1/dist/index.mjs)
   * they all rely on commonjs (https://cdn.jsdelivr.net/npm/lodash@4.17.21/uniq.js for instance)
   */
  'lodash/uniq.js',
  'lodash/pickBy.js',
  'lodash/cloneDeep.js',
  'lodash/throttle.js',
  /**
   * dependency of '@storybook/dist/Color-[hash].msj' (https://cdn.jsdelivr.net/npm/@storybook/blocks@7.5.1/dist/Color-6VNJS4EI.mjs)
   * exports rely on commonjs: https://cdn.jsdelivr.net/npm/color-convert@2.0.1/index.js 
   */
  'color-convert',
  'tocbot',
  '@storybook/blocks',
];
