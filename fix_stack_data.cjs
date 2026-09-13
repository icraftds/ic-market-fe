const fs = require('fs');

let content = fs.readFileSync('app/pages/index.vue', 'utf8');

// Move data-title etc from <button class="btn-primary ..."> to <div class="card-actions hero-featured-btn" ...>
// This is easily done by simply doing a global replace since we just generated this structure.

content = content.replace(/<div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;">\s*<button class="btn-primary card-buy-direct" style="width:100%"\s*(data-title="[^"]+"\s*data-category="[^"]+"\s*data-price="[^"]+"\s*data-img="[^"]+"\s*data-tags="[^"]+")>/g, 
'<div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;" $1>\n                            <button class="btn-primary card-buy-direct" style="width:100%">');

fs.writeFileSync('app/pages/index.vue', content);
console.log('Fixed stack data attributes.');
