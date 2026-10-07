import micromatch from 'micromatch'
const patterns = ['src/**/*.{ts,tsx}', '**/*.test.js', 'docs/**/*.md', 'packages/*/src/**/*.ts', '*.json', 'assets/img/*.{png,jpg,svg}', '**/__tests__/**/*', 'lib/**/index.js', '**/file-?.txt', 'config/[a-c]*.yml']
const isMatch = micromatch.matcher(patterns)
export const operation = ({ paths }) => paths.map((p) => isMatch(p))
