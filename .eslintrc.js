module.exports = {
  extends: "eslint:recommended",
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "no-unused-vars": ["warning"]
  },
};
