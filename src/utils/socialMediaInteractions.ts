
interface LikeButton extends HTMLButtonElement {
  classList: DOMTokenList;
  querySelector: (selector: string) => Element | null;
}

interface SVGPath extends SVGPathElement {
  style: CSSStyleDeclaration;
}

export const toggleLike = (button: LikeButton): void => {
  button.classList.toggle('liked');
  const svg = button.querySelector('svg path') as SVGPath | null;
  
  if (svg && button.classList.contains('liked')) {
    svg.style.fill = '#ed4956';
    svg.style.stroke = '#ed4956';
  } else if (svg) {
    svg.style.fill = 'none';
    svg.style.stroke = 'currentColor';
  }
};

export const initializeNavigation = (): void => {
  // Add active state to navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
    });
  });
};

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
}
