const fs = require('fs');
const path = require('path');

// Configurações
const OUTPUT_FILE = 'projeto_contexto.txt';
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', '.vscode', 'public'];
const EXCLUDE_FILES = [OUTPUT_FILE, 'package-lock.json', 'yarn.lock', '.gitignore', 'favicon.ico'];
const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.env.local'];

const rootDir = __dirname;
let fullContent = '';

function readDirectory(currentPath) {
    const files = fs.readdirSync(currentPath);

    files.forEach(file => {
        const filePath = path.join(currentPath, file);
        const stats = fs.statSync(filePath);
        const relativePath = path.relative(rootDir, filePath);

        // Verifica se deve ignorar a pasta
        if (stats.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                readDirectory(filePath);
            }
        } else {
            // Verifica se deve ignorar o arquivo
            const ext = path.extname(file);
            if (!EXCLUDE_FILES.includes(file) && ALLOWED_EXTENSIONS.includes(ext)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                fullContent += `\n${'='.repeat(50)}\n`;
                fullContent += `ARQUIVO: ${relativePath}\n`;
                fullContent += `${'='.repeat(50)}\n\n`;
                fullContent += content;
                fullContent += `\n\n`;
            }
        }
    });
}

console.log('Gerando contexto do projeto...');
try {
    readDirectory(rootDir);
    fs.writeFileSync(OUTPUT_FILE, fullContent);
    console.log(`Sucesso! Arquivo "${OUTPUT_FILE}" criado com todos os códigos.`);
} catch (error) {
    console.error('Erro ao gerar o arquivo:', error);
}