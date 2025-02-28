import type { Metadata } from 'next';
import Link from 'next/link';
import { IconBriefcase } from '@tabler/icons-react';

export const metadata: Metadata = {
  title: 'Tzironis Business Suite - Chat',
  description: 'Interact with our specialized AI business assistants',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container">
      <header className="header">
        <div className="logo-container">
          <Link href="/">
            <div className="logo-container">
              <div className="logo-icon" style={{ color: '#145199', fontSize: '1.5rem', fontWeight: 'bold' }}>
                <IconBriefcase size={32} />
              </div>
              <span className="logo-text">Tzironis Business Suite</span>
            </div>
          </Link>
        </div>
      </header>
      
      <main className="main">
        {children}
      </main>
    </div>
  );
} 