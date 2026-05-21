// src/components/layout/Container.tsx
export default function Container({ children }: { children: React.ReactNode }) {
  return <div className="max-w-md mx-auto w-full px-4 py-8">{children}</div>;
}
