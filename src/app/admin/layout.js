import Sidebar from '@/components/admin/Sidebar';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SessionProviderWrapper from '@/components/providers/SessionProviderWrapper';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Admin Dashboard - Astana Aliya',
  description: 'Admin dashboard for managing Eid ul Adha participation.',
};

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  // Skip auth check and layout for login page
  if (children.props?.childProp?.segment === 'login') {
    return (
      <html lang="en">
        <body className={inter.className}>
          <SessionProviderWrapper session={session}>
            <div className="min-h-screen bg-background flex">
              <div className="flex-1">{children}</div>
            </div>
          </SessionProviderWrapper>
        </body>
      </html>
    );
  }

  // Render admin layout with Sidebar for authenticated admins
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper session={session}>
          <div className="min-h-screen bg-background flex">
            <Sidebar />
            <div className="flex-1">{children}</div>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}