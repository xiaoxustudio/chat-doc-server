import typescript from "typescript";
import { terser } from "rollup-plugin-terser";
import ts from "rollup-plugin-typescript2";
import { RollupOptions } from "rollup";
const config: RollupOptions = {
	input: "src/index.ts",
	output: {
		file: "dist/server.js",
		format: "cjs",
		sourcemap: true,
	},
	plugins: [
		ts({
			typescript,
		}),
		terser({ compress: true, mangle: true }),
	],
};

export default config;
