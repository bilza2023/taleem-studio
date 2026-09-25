// scripts/chapter/content/blog-test/svgs.js
// key = svg slug (must be in the plan's svgs list) · value = the svg markup

export default {
	'blog-test-circle.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#182035"/>
  <circle cx="200" cy="150" r="90" fill="none" stroke="#f5c542" stroke-width="6"/>
  <line x1="200" y1="150" x2="290" y2="150" stroke="#4fc3f7" stroke-width="4"/>
  <circle cx="200" cy="150" r="5" fill="#ffffff"/>
  <text x="245" y="140" fill="#4fc3f7" font-size="22" font-family="sans-serif" text-anchor="middle">r</text>
</svg>`,

	'blog-test-number-line.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 160">
  <rect width="500" height="160" fill="#182035"/>
  <line x1="30" y1="80" x2="470" y2="80" stroke="#ffffff" stroke-width="3"/>
  <g fill="#ffffff" font-size="20" font-family="sans-serif" text-anchor="middle">
    <line x1="90" y1="70" x2="90" y2="90" stroke="#ffffff" stroke-width="3"/><text x="90" y="120">-2</text>
    <line x1="170" y1="70" x2="170" y2="90" stroke="#ffffff" stroke-width="3"/><text x="170" y="120">-1</text>
    <line x1="250" y1="70" x2="250" y2="90" stroke="#f5c542" stroke-width="3"/><text x="250" y="120" fill="#f5c542">0</text>
    <line x1="330" y1="70" x2="330" y2="90" stroke="#ffffff" stroke-width="3"/><text x="330" y="120">1</text>
    <line x1="410" y1="70" x2="410" y2="90" stroke="#ffffff" stroke-width="3"/><text x="410" y="120">2</text>
  </g>
</svg>`
};