import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  MessageCircle,
  Plus,
  MoreHorizontal,
} from "lucide-react";

// Main navigation items
const mainNavItems = [
  {
    title: "Dashboard",
    icon: Home,
    route: "/dashboard"
  },
  {
    title: "Overview",
    icon: BarChart3,
    route: "/overview"
  },
  {
    title: "AI Assistant",
    icon: MessageCircle,
    route: "/ai-assistant"
  },
  {
    title: "Quick Log",
    icon: Plus,
    route: "/quick-log"
  }
];

const MobileNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Always use light theme based on requirement to extract only light theme
  const isDark = false;

  // Memoize the current path to prevent unnecessary re-renders
  const currentPath = useMemo(() => pathname, [pathname]);

  return (
    <>
      <nav
        className={`
          fixed bottom-0 left-0 right-0
          z-50
          backdrop-blur-md border-t
          md:hidden
          shadow-[0_-4px_20px_0_rgba(0,0,0,0.08)]
          transition-all duration-500
          bg-white/95 border-gray-200/50
        `}
        aria-label="Main navigation"
      >
        <div className="flex justify-between items-center px-2 py-2">
          {mainNavItems.map((item) => {
            const isActive = currentPath === item.route;
            return (
              <button
                key={item.route}
                onClick={() => router.push(item.route)}
                aria-current={isActive ? "page" : undefined}
                className={`
                  mobile-nav-item
                  touch-target
                  transition-all duration-200 ease-out
                  hover:scale-105 active:scale-95
                  flex flex-col items-center justify-center px-1 py-2 min-w-[60px] max-w-[70px] rounded-lg
                  ${isActive 
                    ? 'text-blue-600 bg-blue-50 font-semibold shadow-sm'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon
                  size={22}
                  className={`mb-1 transition-transform duration-150 ${
                    isActive ? 'scale-110' : ''
                  }`}
                  strokeWidth={2}
                />
                <span className="text-[11px] font-medium truncate leading-tight text-center select-none">
                  {item.title}
                </span>
              </button>
            );
          })}          {/* More button */}
          <button
            onClick={() => router.push('/more')}
            className={`
              mobile-nav-item
              touch-target
              transition-all duration-200 ease-out
              hover:scale-105 active:scale-95
              flex flex-col items-center justify-center px-1 py-2 min-w-[60px] max-w-[70px] rounded-lg
              ${currentPath === '/more' 
                ? 'text-blue-600 bg-blue-50 font-semibold shadow-sm'
                : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }
            `}
            aria-label="More"
          >
            <MoreHorizontal 
              size={22} 
              className={`mb-1 transition-transform duration-150 ${
                currentPath === '/more' ? 'scale-110' : ''
              }`} 
              strokeWidth={2} 
            />
            <span className="text-[11px] font-medium">More</span>
          </button>        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;
