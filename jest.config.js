module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRegex: '.*\\.spec\\.(ts|tsx|js)$',
  roots: [
    '<rootDir>/test',
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
  ],
}
