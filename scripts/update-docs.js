const fs = require('fs');
const path = require('path');

/**
 * Script para generar automáticamente el archivo ESTRUCTURA_PROYECTO.md
 */

function generateTree(dir, prefix = '') {
    const ignored = ['node_modules', '.next', '.git', 'dist', 'out'];
    const files = fs.readdirSync(dir);
    let structure = '';

    files.forEach((file, index) => {
        if (ignored.includes(file)) return;

        const filePath = path.join(dir, file);
        const isDirectory = fs.statSync(filePath).isDirectory();
        const isLast = index === files.length - 1;
        const marker = isLast ? '└── ' : '├── ';

        structure += `${prefix}${marker}${file}${isDirectory ? '/' : ''}\n`;

        if (isDirectory) {
            structure += generateTree(filePath, prefix + (isLast ? '    ' : '│   '));
        }
    });

    return structure;
}

const rootDir = path.join(__dirname, '..');
const tree = generateTree(rootDir);

const content = `# Estructura del Proyecto: Inmueble IA

Actualizado automáticamente: ${new Date().toLocaleString()}

\`\`\`text
/inmueble_ia
${tree}\`\`\`

## Notas de Desarrollo
- **src/app**: Contiene las rutas de Next.js.
- **src/lib**: Lógica de APIs (Supabase, AI Staging, etc).
- **src/components**: Componentes de React.
`;

fs.writeFileSync(path.join(rootDir, 'ESTRUCTURA_PROYECTO.md'), content);
console.log('✅ Estructura del proyecto actualizada en ESTRUCTURA_PROYECTO.md');
