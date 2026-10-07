import anymatch from 'anymatch'
const patterns = ['src/**/*.{ts,tsx}', '**/*.test.js', 'docs/**/*.md', 'packages/*/src/**/*.ts', '*.json', 'assets/img/*.{png,jpg,svg}', '**/__tests__/**/*', 'lib/**/index.js', '**/file-?.txt', 'config/[a-c]*.yml']
const test = anymatch(patterns)
export const operation = ({ paths }) => paths.map((p) => test(p))
