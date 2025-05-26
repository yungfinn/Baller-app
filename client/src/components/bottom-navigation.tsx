import { useLocation } from "wouter";

interface BottomNavigationProps {
  activePage: "discover" | "my-events" | "map" | "profile";
}

export default function BottomNavigation({ activePage }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    {
      key: "discover",
      label: "Discover",
      icon: "fas fa-home",
      path: "/",
    },
    {
      key: "my-events",
      label: "My Events",
      icon: "fas fa-calendar",
      path: "/my-events",
    },
    {
      key: "map",
      label: "Map",
      icon: "fas fa-map-marker-alt",
      path: "/map",
    },
    {
      key: "profile",
      label: "Profile",
      icon: "fas fa-user",
      path: "/profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 transition-colors ${
                activePage === item.key
                  ? "nav-active"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <i className={`${item.icon} text-lg mb-1`}></i>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
