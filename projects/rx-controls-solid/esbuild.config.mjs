import esbuild from "esbuild";
import babel from "esbuild-plugin-babel";

async function main() {
  await esbuild.build({
    entryPoints: ["src/public-api.ts"],
    bundle: true,
    outfile: "build/module.js",
    format: "esm",
    plugins: [babel()],
    platform: "neutral",
    target: "es2015",
    external: ["rx-controls", "tslib", "rxjs", "solid-js"],
    // sourcemap: true,
    // target: ['es5'] // if you target es5 with babel, add this option
  });

  await esbuild.build({
    entryPoints: ["src/public-api.ts"],
    bundle: true,
    outfile: "build/main.js",
    format: "cjs",
    plugins: [babel()],
    platform: "neutral",
    target: "es2015",
    external: ["rx-controls", "tslib", "rxjs", "solid-js"],
    // sourcemap: true,
    // target: ['es5'] // if you target es5 with babel, add this option
  });
}

main().catch(() => process.exit(1));
