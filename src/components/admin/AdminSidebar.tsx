import Link from 'next/link';

const navItems = [
  { href: '/admin', label: '概览' },
  { href: '/admin/organizations', label: '机构' },
  { href: '/admin/dramas', label: '剧集' },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-56 border-r border-white/10 bg-brand-card px-4 py-5 md:block">
      <Link href="/admin" className="font-display text-2xl text-brand-gold">
        方直智胜
      </Link>
      <nav className="mt-8 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm text-stone-200 hover:bg-white/10">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
