'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', label: '\u9996\u9875', icon: '\u{1F3E0}' },
  { href: '/history', label: '\u5386\u53F2\u9884\u6D4B', icon: '\u{1F4CB}' },
  { href: '/analysis', label: '\u6570\u636E\u5206\u6790', icon: '\u{1F4CA}' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-4 rounded-lg transition-colors ${
                isActive
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
