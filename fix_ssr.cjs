const fs = require('fs');
let file = fs.readFileSync('app/pages/index.vue', 'utf8');

file = file.replace(
    /if \(response\?\.meta\) \{[\s\S]*?totalProducts\.value = response\.meta\.total;[\s\S]*?hasMore\.value = response\.meta\.current_page < response\.meta\.last_page;[\s\S]*?\}/,
    `if (response?.meta) {
        totalProducts.value = response.meta.total;
        hasMore.value = response.meta.current_page < response.meta.last_page;
    } else if (response?.data) {
        // Fallback if backend doesn't return meta (not updated yet)
        totalProducts.value = Array.isArray(response.data) ? response.data.length : 0;
        hasMore.value = false;
    }`
);

fs.writeFileSync('app/pages/index.vue', file);
console.log('Update complete');
