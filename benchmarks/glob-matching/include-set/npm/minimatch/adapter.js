import { Minimatch } from 'minimatch'
const patterns = ['src/**/*.{ts,tsx}', '**/*.test.js', 'docs/**/*.md', 'packages/*/src/**/*.ts', '*.json', 'assets/img/*.{png,jpg,svg}', '**/__tests__/**/*', 'lib/**/index.js', '**/file-?.txt', 'config/[a-c]*.yml']
const matchers = patterns.map((p) => new Minimatch(p))
export const operation = ({ paths }) => paths.map((p) => matchers.some((m) => m.match(p)))
