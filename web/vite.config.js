import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // strictPort: se a 5173 estiver ocupada, falha com um erro claro em vez de mudar para a 5174
  // (a API só aceita pedidos da origem CLIENT_URL=http://localhost:5173)
  server: { port: 5173, strictPort: true },
  // Silencia os avisos do Bootstrap com a versão nova do SASS
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        quietDeps: true,
        silenceDeprecations: ['mixed-decls', 'color-functions']
      }
    }
  }
});
