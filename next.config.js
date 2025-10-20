const fs = require('node:fs')
const path = require('node:path')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const ORT_MJS_PATTERN = /ort\..*\.mjs$/
const ORT_MJS_MODULE_TEST = /[\\/]onnxruntime-web[\\/].*\.mjs$/

/**
 * A fork of 'next-pwa' that has app directory support
 * @see https://github.com/shadowwalker/next-pwa/issues/424#issuecomment-1332258575
 */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

const resolveIfExists = (specifier) => {
  try {
    return require.resolve(specifier)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[next.config] Skipping missing module: ${specifier}`)
    }
    return null
  }
}

const buildCopyPatterns = () => {
  const patterns = [
    {
      from: path.join(__dirname, 'model'),
      to: 'static/chunks/app/(game)',
      noErrorOnMissing: true,
    },
  ]

  const ortAssets = [
    // Threaded SIMD variants (preferred when available)
    { specifier: 'onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', filename: 'ort-wasm-simd-threaded.wasm' },
    { specifier: 'onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm', filename: 'ort-wasm-simd-threaded.jsep.wasm' },
    { specifier: 'onnxruntime-web/dist/ort-wasm-threaded.wasm', filename: 'ort-wasm-threaded.wasm' },
    { specifier: 'onnxruntime-web/dist/ort-wasm-threaded.jsep.wasm', filename: 'ort-wasm-threaded.jsep.wasm' },
    // Also copy non-threaded fallbacks when present
    { specifier: 'onnxruntime-web/dist/ort-wasm-simd.wasm', filename: 'ort-wasm-simd.wasm' },
    { specifier: 'onnxruntime-web/dist/ort-wasm-simd.jsep.wasm', filename: 'ort-wasm-simd.jsep.wasm' },
    { specifier: 'onnxruntime-web/dist/ort-wasm.wasm', filename: 'ort-wasm.wasm' },
    { specifier: 'onnxruntime-web/dist/ort-wasm.jsep.wasm', filename: 'ort-wasm.jsep.wasm' },
  ]

  const publicModelDir = path.join(__dirname, 'public', 'model')
  if (!fs.existsSync(publicModelDir)) {
    fs.mkdirSync(publicModelDir, { recursive: true })
  }

  ortAssets.forEach(({ specifier, filename }) => {
    const resolved = resolveIfExists(specifier)
    if (!resolved) {
      return
    }
    patterns.push({
      from: resolved,
      to: `static/chunks/app/(game)/${filename}`,
    })
    patterns.push({
      from: resolved,
      to: path.join(publicModelDir, filename),
    })

    // Also copy threaded variants to canonical fallback names (remove '-threaded') so
    // the runtime can successfully fetch either the threaded or non-threaded filename.
    const canonical = filename.replace(/-threaded/g, '')
    if (canonical !== filename) {
      patterns.push({ from: resolved, to: path.join(publicModelDir, canonical) })
      patterns.push({ from: resolved, to: `static/chunks/app/(game)/${canonical}` })
    }
  })

  return patterns
}

const nextConfig = {
  // uncomment the following snippet if using styled components
  // compiler: {
  //   styledComponents: true,
  // },
  reactStrictMode: true, // Recommended for the `pages` directory, default in `app`.
  images: {},
  webpack(config, { isServer }) {
    if (!isServer) {
      // We're in the browser build, so we can safely exclude the sharp module
      config.externals.push('sharp')
    }

    config.plugins.push(new NodePolyfillPlugin())
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: ORT_MJS_PATTERN,
      }),
    )

    const copyPatterns = buildCopyPatterns()
    if (copyPatterns.length > 0) {
      config.plugins.push(
        new CopyPlugin({
          patterns: copyPatterns,
        }),
      )
    }

    if (config.optimization?.minimizer) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer?.constructor?.name !== 'TerserPlugin') {
          return
        }
        const ortExclude = ORT_MJS_PATTERN
        const existingExclude = minimizer.options?.exclude
        if (Array.isArray(existingExclude)) {
          existingExclude.push(ortExclude)
        } else if (existingExclude) {
          minimizer.options.exclude = [existingExclude, ortExclude]
        } else {
          minimizer.options.exclude = [ortExclude]
        }

        minimizer.options.terserOptions = {
          ...minimizer.options.terserOptions,
          parse: {
            ...(minimizer.options.terserOptions?.parse ?? {}),
            ecma: 2020,
          },
          ecma: 2020,
          module: true,
        }
      })
    }

    config.module.rules.push({
      test: ORT_MJS_MODULE_TEST,
      type: 'javascript/esm',
      resolve: {
        fullySpecified: false,
      },
      parser: {
        javascript: {
          importMeta: true,
        },
      },
    })
    // audio support
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      exclude: config.exclude,
      use: [
        {
          loader: require.resolve('url-loader'),
          options: {
            limit: config.inlineImageLimit,
            fallback: require.resolve('file-loader'),
            publicPath: `${config.assetPrefix}/_next/static/images/`,
            outputPath: `${isServer ? '../' : ''}static/images/`,
            name: '[name]-[hash].[ext]',
            esModule: config.esModule || false,
          },
        },
      ],
    })

    // shader support
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    })

    return config
  },
}

const KEYS_TO_OMIT = ['webpackDevMiddleware', 'configOrigin', 'target', 'analyticsId', 'webpack5', 'amp', 'assetPrefix']

module.exports = (_phase, { defaultConfig }) => {
  const plugins = [[withPWA], [withBundleAnalyzer, {}]]

  const wConfig = plugins.reduce((acc, [plugin, config]) => plugin({ ...acc, ...config }), {
    ...defaultConfig,
    ...nextConfig,
  })

  const finalConfig = {}
  Object.keys(wConfig).forEach((key) => {
    if (!KEYS_TO_OMIT.includes(key)) {
      finalConfig[key] = wConfig[key]
    }
  })

  return finalConfig
}
