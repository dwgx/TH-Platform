/* global React, lucide */
// Lucide icon helper — line-art, stroke 1.75, currentColor.
// Lucide IIFE exposes window.lucide.icons with raw SVG node arrays.

(function () {
  const icons = (typeof lucide !== 'undefined' && lucide.icons) ? lucide.icons : {};
  // Build raw SVG string from Lucide's [tag, attrs, children?] node tree
  function nodeToSvg(node) {
    if (!Array.isArray(node)) return '';
    const [tag, attrs = {}, children = []] = node;
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    const inner = Array.isArray(children) ? children.map(nodeToSvg).join('') : '';
    return `<${tag} ${attrStr}>${inner}</${tag}>`;
  }
  function Lu({ name, size = 16, stroke = 1.75, color = 'currentColor', style = {} }) {
    const ic = icons[name];
    if (!ic) return null;
    const inner = (Array.isArray(ic) ? ic : []).map(nodeToSvg).join('');
    return React.createElement('svg', {
      width: size, height: size, viewBox: '0 0 24 24',
      fill: 'none', stroke: color, strokeWidth: stroke,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      style: { display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style },
      dangerouslySetInnerHTML: { __html: inner },
    });
  }
  window.Lu = Lu;
})();
