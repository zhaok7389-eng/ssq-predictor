'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', label: '\u53D1\u8D22\u4E3B\u9875', icon: '\u{1F437}' },
  { href: '/predict', label: '\u62BD\u7B7E\u9884\u6D4B', icon: '\u{1F3B0}' },
  { href: '/history', label: '\u5C0F\u91D1\u5E93', icon: '\u{1F4B0}' },
  { href: '/analysis', label: '\u5996\u7CBE\u79D8\u7C4D', icon: '\u{1F4D6}' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-pink-100 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-pink-500'
                  : 'text-gray-400 hover:text-pink-300'
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
