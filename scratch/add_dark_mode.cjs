const fs = require('fs');
const cssFile = 'src/index.css';

const darkModeStyles = `
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #080a0f;
    --bg-secondary: #11141d;
    --bg-surface: rgba(18, 22, 33, 0.85);
    --bg-surface-elevated: rgba(26, 32, 44, 0.95);
    --bg-surface-hover: rgba(35, 42, 59, 0.95);
    --bg-card: rgba(18, 22, 33, 0.95);
    --bg-glass: rgba(15, 20, 30, 0.85);

    --text-main: #f8fafc;
    --text-muted: rgba(255, 255, 255, 0.7);
    --text-subtle: rgba(255, 255, 255, 0.45);

    --border-color: rgba(255, 255, 255, 0.08);
    --border-focus: rgba(59, 130, 246, 0.5);

    --glass-border: 1px solid rgba(255, 255, 255, 0.06);
    --glass-border-light: 1px solid rgba(255, 255, 255, 0.1);
    
    --neo-gold: #f1f5f9;
    --neo-gold-soft: rgba(255, 255, 255, 0.1);
    --neo-gold-border: rgba(255, 255, 255, 0.15);
    
    --neu-flat: 4px 4px 10px rgba(0, 0, 0, 0.4), -4px -4px 10px rgba(255, 255, 255, 0.03);
    --neu-raised: 8px 8px 16px rgba(0, 0, 0, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.03);
    --neu-inset: inset 2px 2px 5px rgba(0, 0, 0, 0.5), inset -2px -2px 5px rgba(255, 255, 255, 0.02);
    --neu-pill: 2px 2px 5px rgba(0, 0, 0, 0.4), -2px -2px 5px rgba(255, 255, 255, 0.03);
    
    --role-admin: #f8fafc;
    --role-admin-bg: rgba(255, 255, 255, 0.1);
    --role-admin-border: rgba(255, 255, 255, 0.2);
  }
}
`;

fs.appendFileSync(cssFile, darkModeStyles, 'utf8');
console.log('Appended dark mode styles');
