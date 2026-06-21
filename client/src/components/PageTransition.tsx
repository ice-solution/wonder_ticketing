import { useLocation } from "wouter";
import "@/styles/page-transition.css";

/** 路由切換時淡入 + 輕微上移，key 隨 path 變化觸發 CSS animation */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <div key={location} className="page-transition">
      {children}
    </div>
  );
}
