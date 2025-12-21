const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');
/*const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');*/
const baseTheme = require('./src/baseTheme');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const VersionFile = require('webpack-version-file');
//const AntdMomentWebpackPlugin = require('@ant-design/moment-webpack-plugin');

const rootPath = __dirname;
const baseFolder = "src";
const appName = "frontend";
const buildFolder = `static/${appName}`;
//const analyzeBundle = process.env.ENV === 'analyze';
//const isDevMode = process.env.ENV === 'development';

//console.log(`--->${rootPath} - ${baseFolder} - ${buildFolder} - ${analyzeBundle} - ${isDevMode}`)


function recursiveIssuer(m, c) {
    const issuer = c.moduleGraph.getIssuer(m);
    // For webpack@4 issuer = m.issuer
    if (issuer) {
        return recursiveIssuer(issuer, c);
    }
    const chunks = c.chunkGraph.getModuleChunks(m);
    // For webpack@4 chunks = m._chunks
    for (const chunk of chunks) {
        return chunk.name;
    }
    return false;
}



module.exports = (env, argv) => {

    const isDevMode = argv.mode === 'development';
    console.log(`RootPath--->${rootPath} - BaseFolder--->${baseFolder} - BuildFolder--->${buildFolder}`);
    console.log(`Compile Mode--->${argv.mode}`);

    const commonPlugins = [
        new VersionFile({
            data: {
                date: new Date(),
                //environment: process.env.NODE_ENV || 'development'
            }
        }),
        new HtmlWebPackPlugin({
            template: path.join(rootPath, "src", "index.html"),
            chunks: ["vendors", "commons", `${appName}/index`],
            filename: path.join(rootPath, "templates", appName, "index.html"),
            inject: true
        }),
        new MiniCssExtractPlugin({
            filename: isDevMode ? '[name].css' : '[name].[contenthash].css',
            chunkFilename: isDevMode ? '[id].css' : '[id].[contenthash].css',
            ignoreOrder: true
        }),
        // new AntdMomentWebpackPlugin()
        /*new AntdDayjsWebpackPlugin({
            replaceMoment: true, plugins: [
                'isSameOrBefore',
                'isSameOrAfter',
                'advancedFormat',
                'customParseFormat',
                'weekday',
                'weekYear',
                'weekOfYear',
                'isMoment',
                'localeData',
                'localizedFormat'
            ]
        })*/
    ]
    const devPlugins = []
    const prodPlugins = []
    const pluginsList = isDevMode ? [...commonPlugins, ...devPlugins] : [...commonPlugins, ...devPlugins, ...prodPlugins];

    return {
        //...(isDevMode ? { devtool: 'source-map' } : {}),
        devtool: 'source-map',
        mode: isDevMode ? 'development' : 'production',
        watch: true,
        watchOptions: {
            aggregateTimeout: 200,
            poll: 1000,
            ignored: ['node_modules/**', 'dist/**', 'static/**', "*.log", "*.lock", "*.code-workspace", "__pycache__/**"]
        },
        entry: {
            [`${appName}/index`]: [`./${baseFolder}/index.jsx`, ...(isDevMode ? [] : [])]
        },
        output: {
            path: path.resolve(rootPath, buildFolder),
            filename: "[name].js",
            chunkFilename: isDevMode ? 'chunks/[name].chunk.js' : 'chunks/[name]/[chunkhash].chunk.js',
            publicPath: `/static/${appName}/`,
        },
        resolve: {
            extensions: ["*", ".less", ".js", ".jsx", ".scss", ".css", ".json", ".html"],
            modules: [`${rootPath}/${baseFolder}`, 'node_modules'],
            alias: {
                config: path.resolve(rootPath, "src", 'config'),
                components: path.resolve(rootPath, "src", 'components'),
                assets: path.resolve(rootPath, "src", 'assets'),
                'react/jsx-dev-runtime.js': path.resolve(rootPath, 'node_modules', 'react', 'jsx-dev-runtime.js'),
                'react/jsx-runtime.js': path.resolve(rootPath, 'node_modules', 'react', 'jsx-runtime.js')
            }
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    include: path.resolve(rootPath, "src"),
                    exclude: /node_modules/,
                    use: [{
                        loader: "babel-loader", options: {
                            babelrc: false,
                            presets: [["@babel/preset-env", { modules: false, useBuiltIns: 'usage', corejs: 3 }], "@babel/preset-react"],
                            plugins: [
                                "@babel/plugin-syntax-export-default-from"
                            ]
                        }
                    }
                    ]
                },
                {
                    test: /\.html$/,
                    use: [{ loader: "html-loader", options: { minimize: true } }]
                },
                {
                    test: /\.css$/i,
                    use: [
                        { loader: MiniCssExtractPlugin.loader },
                        { loader: 'css-loader' },
                        {
                            loader: 'postcss-loader', 
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        require('tailwindcss'),
                                        require('autoprefixer'),
                                        ["postcss-preset-env", {}]
                                    ]
                                },
                            }
                        }
                    ]
                },
                {
                    test: /\.less$/i,
                    use: [
                        { loader: 'style-loader' },
                        { loader: 'css-loader' },
                        {
                            loader: 'less-loader',
                            options: {
                                lessOptions: {
                                    javascriptEnabled: true,
                                    modifyVars: baseTheme
                                },

                            }
                        }
                    ]
                },
                {
                    test: /\.(png|jpg|gif)$/i,
                    type: 'asset/resource'
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                presets: [["@babel/preset-env", { modules: false, useBuiltIns: 'usage', corejs: 3 }], "@babel/preset-react"]
                            }
                        },
                        {
                            loader: '@svgr/webpack',
                            options: {
                                babel: false,
                                icon: true,
                            },
                        },
                    ],
                }
                /* {
                    test: /\.svg/,
                    type: 'asset/inline'
                } */

            ]
        },
        optimization: {
            splitChunks: {
                maxInitialRequests: Infinity,
                minSize: 0,
                cacheGroups: {
                    "vendors": {
                        test: /[\\/]node_modules[\\/]/,
                        chunks: 'all',
                        chunks: isDevMode ? "initial" : "all",
                        name: "vendors",
                        enforce: true,
                        //maxSize: 1000000,
                        reuseExistingChunk: true
                    },
                    "commons": {
                        name: "commons", // The name of the chunk containing all common code
                        chunks: "initial",
                        minChunks: 2  // This is the number of modules
                    },
                    "appStyles": {
                        test: (m, c, entry = `${appName}/index`) => m.constructor.name === 'CssModule' && recursiveIssuer(m, c) === entry,
                        chunks: 'all',
                        enforce: true,
                        reuseExistingChunk: true,
                        name: `app_styles`
                    }
                }
            },
            minimize: isDevMode ? false : true,
            minimizer: [
                new TerserPlugin({
                    parallel: 4,
                    terserOptions: {
                        //cache: true,
                        //parallel: true,
                        toplevel: false,
                        compress: {
                            warnings: false,
                            drop_console: true,
                            global_defs: {
                                "@alert": "console.log"
                            }
                        },
                        output: {
                            comments: false
                        },
                        parse: {}
                    }
                }),
                `...`,
                new CssMinimizerPlugin()
            ],
            runtimeChunk: { name: "runtime" }
        },
        plugins: pluginsList
    };
}