'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/', label: '发财主页', icon: '🐷' },
  { href: '/predict', label: '抽签预测', icon: '🎰' },
  { href: '/history', label: '小金库', icon: '💰' },
  { href: '/analysis', label: '妖精秘籍', icon: '📖' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-bottom z-50">
      <div className="max-w-lg mx-auto flex justify-around py-3">
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
