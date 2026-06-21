import { useEffect } from "react";

export function useInViewAnimation(selector = ".reveal") {
  useEffect(() => {
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selector]);
}
