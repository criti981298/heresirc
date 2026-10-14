// Keep the first screen light; prepare WebGL shortly before the story enters.
const journey = document.querySelector('.giraffe-journey');
if (journey) {
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    void import('./giraffe');
  }, { rootMargin: '700px 0px' });
  observer.observe(journey);
}

export {};
