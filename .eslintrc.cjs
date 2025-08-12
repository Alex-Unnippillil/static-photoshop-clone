module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint"],
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
};
