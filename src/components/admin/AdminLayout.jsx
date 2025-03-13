import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import LoadingSpinner from './LoadingSpinner';

function AdminLayoutContent({ 
  children, 
  title, 
  subtitle,
  loading = false,
  requireAdmin = true,
  requireOwner = false
}) {
  const router = useRouter();
  const { isOpen } = useSidebar();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Periksa status login
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      window.location.href = '/login';
      return;
    }

    const user = JSON.parse(adminUser);
    
    if (requireOwner && user.role !== 'owner') {
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
      return;
    }
    
    if (requireAdmin && !['admin', 'owner'].includes(user.role)) {
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [requireAdmin, requireOwner, router]);

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#1a1a1a] overflow-hidden">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'sm:ml-64' : 'sm:ml-0'} overflow-x-hidden`}>
        <Header />
        
        <main className="p-4 sm:p-6 pt-20 sm:pt-20">
          {(title || subtitle) && (
            <div className="mb-6 sm:mb-8">
              {title && <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{title}</h1>}
              {subtitle && <p className="text-gray-400">{subtitle}</p>}
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}

const AdminLayout = ({ 
  children, 
  title, 
  subtitle,
  loading = false,
  requireAdmin = true,
  requireOwner = false
}) => {
  return (
    <SidebarProvider>
      <AdminLayoutContent 
        title={title} 
        subtitle={subtitle}
        loading={loading}
        requireAdmin={requireAdmin}
        requireOwner={requireOwner}
      >
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
};

export default AdminLayout; 