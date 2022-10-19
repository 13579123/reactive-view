import path from 'path'
import resolve from 'rollup-plugin-node-resolve' // 依赖引用插件
import commonjs from 'rollup-plugin-commonjs' // commonjs模块转换插件
import ts from 'rollup-plugin-typescript2'

const extensions = [
    '.js',
    '.ts',
    '.tsx'
]

// ts
const tsPlugin = ts({
    tsconfig: path.resolve(__dirname, './tsconfig.json'), // 导入本地ts配置
    extensions
})


// 基础配置
const commonConf = {
    input: path.resolve(__dirname, './src/index.ts'),
    plugins:[
        resolve(extensions),
        commonjs(),
        tsPlugin,
    ]
}
// 需要导出的模块类型
const outputMap = [
    {
        file: "dist/rvw.js", // 通用模块
        format: 'umd',
    },
]


const buildConf = options => Object.assign({}, commonConf, options)


export default outputMap.map(
    output => buildConf({ output: {name: "Rvw", ...output} })
)
