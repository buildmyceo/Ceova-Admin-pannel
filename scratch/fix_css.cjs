const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

// Replace dark backgrounds
css = css.replace(/background:\s*rgba\(\s*8\s*,\s*8\s*,\s*8\s*,\s*0\.85\s*\)/g, 'background: var(--bg-surface)');
css = css.replace(/background:\s*#000000/g, 'background: var(--bg-secondary)');
css = css.replace(/background-color:\s*#000000/g, 'background-color: var(--bg-secondary)');
css = css.replace(/background:\s*rgba\(\s*12\s*,\s*12\s*,\s*12\s*,\s*0\.75\s*\)/g, 'background: var(--bg-card)');
css = css.replace(/background:\s*rgba\(\s*18\s*,\s*18\s*,\s*18\s*,\s*0\.7\s*\)/g, 'background: var(--bg-surface)');
css = css.replace(/background:\s*rgba\(\s*26\s*,\s*26\s*,\s*26\s*,\s*0\.85\s*\)/g, 'background: var(--bg-surface-elevated)');
css = css.replace(/background:\s*rgba\(\s*36\s*,\s*36\s*,\s*36\s*,\s*0\.95\s*\)/g, 'background: var(--bg-surface-hover)');

// Split to lines to avoid mutating :root
let lines = css.split('\n');
for (let i = 90; i < lines.length; i++) {
    // Replace white transparent with black transparent (except in text color or specific)
    if (!lines[i].includes('color: #fff') && !lines[i].includes('color: #ffffff')) {
        lines[i] = lines[i].replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)/g, 'rgba(0, 0, 0, $1)');
    }
    
    // Convert hardcoded white text to var(--text-main) unless it's a primary button (which has background: var(--accent-gradient))
    // We'll just be careful. Actually, most text should be dark now. 
    // Just replace `color: #fff` with `color: var(--text-main)` in a few specific places if they are on light backgrounds.
    // Let's just remove neon box shadows.
    lines[i] = lines[i].replace(/box-shadow:\s*0\s+0\s+\d+px\s+[^;]+;/g, 'box-shadow: none;');
}

css = lines.join('\n');
fs.writeFileSync('src/index.css', css, 'utf-8');
console.log('Fixed CSS neon colors and dark hardcodes');
