// Starts the Expo web dev server in mock mode (EXPO_PUBLIC_MOCK=1).
// Cross-platform replacement for `EXPO_PUBLIC_MOCK=1 expo start --web`, which
// doesn't work in Windows shells. Extra arguments are passed through, e.g.
//   npm run web:mock -- --port 8082
// Set EXPO_PUBLIC_MOCK_SCENARIO=empty|error beforehand to pick a scenario.
const { spawn } = require("child_process");

const child = spawn("npx", ["expo", "start", "--web", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, EXPO_PUBLIC_MOCK: "1" },
});

child.on("exit", (code) => process.exit(code ?? 0));
