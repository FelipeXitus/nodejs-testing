export default {
  testMatch: ["**/tests/**/*.test.[jt]s?(x)"],
  setupFilesAfterEnv: ["./tests/test-setup.js"],
  testEnvironment: "node",
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  transform: {},
};