import nextConfig from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['src/generated/**'] },
  ...nextConfig,
  {
    rules: {
      'no-console': 'warn',
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
