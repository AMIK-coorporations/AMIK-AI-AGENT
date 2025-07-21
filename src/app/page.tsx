import AmikClient from './amik-client';

export default function Home() {
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center p-4 overflow-hidden">
      <AmikClient />
    </main>
  );
}
