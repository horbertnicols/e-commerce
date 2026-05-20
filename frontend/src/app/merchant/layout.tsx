'use client';

import MerchantGuard from '@/components/admin/MerchantGuard';
import MerchantSidebar from '@/components/admin/MerchantSidebar';

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MerchantGuard>
      <div className="min-h-screen flex bg-gray-50">
        <MerchantSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </MerchantGuard>
  );
}
