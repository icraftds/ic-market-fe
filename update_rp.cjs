const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/**/*.vue');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace basic formatRp definition
    content = content.replace(/const formatRp = \((\w+)\) => 'Rp ' \+ Number\(\1\s*\|\|\s*0\).toLocaleString\('id-ID'\)/g, 
        "const formatCoin = ($1) => Number($1 || 0).toLocaleString('id-ID')");
    content = content.replace(/const formatRp = \((\w+)\) => 'Rp ' \+ \1\.toLocaleString\('id-ID'\)/g, 
        "const formatCoin = ($1) => Number($1 || 0).toLocaleString('id-ID')");
    content = content.replace(/const formatRp = \((\w+)\) => new Intl\.NumberFormat\('id-ID', \{[^}]+\}\)\.format\(\1\)/g, 
        "const formatCoin = ($1) => Number($1 || 0).toLocaleString('id-ID')");
    content = content.replace(/const formatRp = \((\w+)\) =>\s*\n\s*(\1 === 0 \|\| !\1)\s*\? 'Gratis'\s*: 'Rp ' \+ Number\(\1\)\.toLocaleString\('id-ID'\)/g,
        "const formatCoin = ($1) => Number($1 || 0).toLocaleString('id-ID')");

    // Replace usage in templates
    content = content.replace(/\{\{\s*formatRp\(([^}]+)\)\s*\}\}/g, 
        `<i class="fa-solid fa-coins" style="color: #f59e0b"></i> {{ formatCoin($1) }}`);

    // specific to index.vue
    content = content.replace(/\{\{\s*product\.price === 0 \? 'Gratis' : `Rp \$\{Number\(product\.price\)\.toLocaleString\('id-ID'\)\}`\s*\}\}/g,
        `<span v-if="product.price === 0">Gratis</span><span v-else><i class="fa-solid fa-coins" style="color: #f59e0b"></i> {{ Number(product.price).toLocaleString('id-ID') }}</span>`);

    content = content.replace(/`Rp \$\{parseInt\(card\.dataset\.price\)\.toLocaleString\('id-ID'\)\}`/g,
        "`<i class='fa-solid fa-coins' style='color: #f59e0b'></i> ` + parseInt(card.dataset.price).toLocaleString('id-ID')");
    
    // Check for `formatRp` calls that might need conditional rendering if they were handling 'Gratis' internally before
    // e.g. item.isFree ? 'Gratis' : formatRp(...)
    content = content.replace(/\{\{\s*item\.isFree \? 'Gratis' : formatRp\(([^)]+)\)\s*\}\}/g,
        `<span v-if="item.isFree">Gratis</span><span v-else><i class="fa-solid fa-coins" style="color: #f59e0b"></i> {{ formatCoin($1) }}</span>`);
        
    // specific to topup.vue
    content = content.replace(/Rp\s*\{\{\s*Number\(session\?\.coins\s*\|\|\s*0\)\.toLocaleString\('id-ID'\)\s*\}\}\s*iCoin-Z/g,
        "{{ Number(session?.coins || 0).toLocaleString('id-ID') }}");
    content = content.replace(/Rp\s*\{\{\s*Number\(amt\.value\)\.toLocaleString\('id-ID'\)\s*\}\}/g,
        "{{ Number(amt.value).toLocaleString('id-ID') }}");

    // Remove any double coins icons if they exist
    content = content.replace(/<i class="fa-solid fa-coins"[^>]*><\/i>\s*<i class="fa-solid fa-coins"[^>]*><\/i>/g, '<i class="fa-solid fa-coins" style="color: #f59e0b"></i>');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
