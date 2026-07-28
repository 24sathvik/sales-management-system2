export function NavItem({ href, label }: { href: string; label: string }) {
  return <a href={href} className="flex items-center p-2 rounded hover:bg-muted">{label}</a>;
}
