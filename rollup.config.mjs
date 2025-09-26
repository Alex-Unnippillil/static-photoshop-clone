import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { visualizer } from "rollup-plugin-visualizer";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/bundle/index.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    nodeResolve({ extensions: [".ts", ".js"] }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json", sourceMap: true }),
    visualizer({
      filename: "dist/bundle-report.html",
      template: "sunburst",
      gzipSize: true,
      brotliSize: true,
      sourcemap: true,
    }),
    visualizer({
      filename: "dist/bundle-report.json",
      template: "raw-data",
    }),
  ],
};
