import AmikClient from './amik-client';

export default function Home() {
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      <AmikClient />
    </main>
  );
}
