import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'out/**',
      '.npm-cache/**'
    ]
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off'
    }
  }
];

export default eslintConfig;
