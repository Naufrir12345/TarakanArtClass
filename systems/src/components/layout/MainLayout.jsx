import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  Layers,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  PlusCircle,
  Package,
  BookOpen,
  BarChart2,
  MessageCircle,
  Shield,
  Fingerprint,
  CloudLightning,
  FileText,
  Bell,
  MessageSquare,
  Check,
  ExternalLink
} from 'lucide-react';

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const countRes = await api.get('/api/parent-messages/unread-count');
      setUnreadCount(countRes.data.count);

      const msgsRes = await api.get('/api/parent-messages');
      setMessages(msgsRes.data);
    } catch (err) {
      console.error('Failed to fetch parent messages:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/parent-messages/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Layers, group: 'Utama' },
    { name: 'Registrasi Siswa', path: '/registrasi', icon: PlusCircle, group: 'Utama', allowedRoles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Data Siswa', path: '/siswa', icon: Users, group: 'Utama', allowedRoles: ['SUPERADMIN', 'ADMIN', 'TEACHER'] },
    { name: 'Kelas & Program', path: '/kelas', icon: BookOpen, group: 'Akademik', allowedRoles: ['SUPERADMIN', 'ADMIN', 'TEACHER'] },
    { name: 'Holiday Class', path: '/holiday-class', icon: Calendar, group: 'Akademik', allowedRoles: ['SUPERADMIN', 'ADMIN', 'TEACHER'] },
    { name: 'Jadwal & Pengganti', path: '/jadwal', icon: Calendar, group: 'Akademik', allowedRoles: ['SUPERADMIN', 'ADMIN', 'TEACHER'] },
    { name: 'Rapor', path: '/rapor', icon: FileSpreadsheet, group: 'Akademik', allowedRoles: ['SUPERADMIN', 'ADMIN', 'TEACHER'] },
    { name: 'Pembayaran', path: '/pembayaran', icon: CreditCard, group: 'Keuangan', allowedRoles: ['SUPERADMIN', 'ADMIN', 'FINANCE'] },
    { name: 'Tagihan & Invoice', path: '/invoices', icon: FileText, group: 'Keuangan', allowedRoles: ['SUPERADMIN', 'ADMIN', 'FINANCE'] },
    { name: 'Keuangan', path: '/keuangan', icon: BarChart2, group: 'Keuangan', allowedRoles: ['SUPERADMIN', 'FINANCE', 'OWNER'] },
    { name: 'Inventaris', path: '/inventaris', icon: Package, group: 'Keuangan', allowedRoles: ['SUPERADMIN', 'ADMIN', 'FINANCE'] },
    { name: 'WhatsApp Queue', path: '/wa-queue', icon: MessageCircle, group: 'Otomasi', allowedRoles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Analytics', path: '/analytics', icon: BarChart2, group: 'Otomasi', allowedRoles: ['SUPERADMIN', 'OWNER', 'ADMIN'] },
    { name: 'Fingerprint Attendance', path: '/fingerprint', icon: Fingerprint, group: 'Otomasi', allowedRoles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'Role Management', path: '/roles', icon: Shield, group: 'Pengaturan', allowedRoles: ['SUPERADMIN'] },
    { name: 'Manajemen Karyawan', path: '/staff', icon: Users, group: 'Pengaturan', allowedRoles: ['SUPERADMIN'] },
    { name: 'Log Aktivitas', path: '/activity-log', icon: FileText, group: 'Pengaturan', allowedRoles: ['SUPERADMIN'] },
    { name: 'Integrasi Accurate', path: '/accurate', icon: CloudLightning, group: 'Pengaturan', allowedRoles: ['SUPERADMIN'] },
  ];

  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const filteredMenuItems = menuItems.filter(item => {
    if (item.allowedRoles) {
      return item.allowedRoles.includes(userRole);
    }
    return true;
  });

  // Group menu items by section
  const groups = [...new Set(filteredMenuItems.map(m => m.group))];


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 relative z-10 ${collapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 bg-slate-50/50">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <span className="font-extrabold text-slate-800 tracking-tight text-lg">
                Manufindo Les
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg mx-auto">
              M
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Sidebar Menu Items - Grouped */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group}>
              {!collapsed && (
                <div className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {group}
                </div>
              )}
              {filteredMenuItems.filter(m => m.group === group).map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path ||
                  (item.path !== '/' && currentPath.startsWith(item.path));
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Profile */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/30">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors ${collapsed ? 'mx-auto' : ''
                }`}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white h-full border-r border-slate-200 z-50">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <span className="font-extrabold text-slate-800 tracking-tight text-lg">
                  Manufindo Les
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {groups.map((group) => (
                <div key={group}>
                  <div className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {group}
                  </div>
                  {filteredMenuItems.filter(m => m.group === group).map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path ||
                      (item.path !== '/' && currentPath.startsWith(item.path));
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 shrink-0 relative z-9">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center space-x-4 relative">
            {/* Notification Circular Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-slate-550 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all relative border border-slate-200"
                title="Pesan dari Orang Tua"
              >
                <MessageSquare size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <>
                  {/* Overlay background to close dropdown when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 text-left">
                    <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-indigo-50/50">
                      <span className="font-extrabold text-sm text-slate-800">Pesan Orang Tua</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-150">
                        {unreadCount} Belum Dibaca
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {messages.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <MessageSquare size={24} className="mx-auto mb-2 text-slate-350" />
                          <p className="text-xs font-semibold">Tidak ada pesan masuk</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3.5 hover:bg-slate-50 transition-colors flex flex-col gap-1.5 ${
                              !msg.isRead ? 'bg-indigo-50/20 font-semibold' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold text-slate-800">{msg.parentName}</p>
                                <p className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString('id-ID')}</p>
                              </div>
                              <div className="flex gap-1.5 z-50">
                                {!msg.isRead && (
                                  <button
                                    onClick={() => handleMarkAsRead(msg.id)}
                                    className="p-1 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-md transition-colors"
                                    title="Tandai Sudah Dibaca"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                                <a
                                  href={`https://wa.me/${msg.parentPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 hover:bg-indigo-50 text-slate-450 hover:text-indigo-600 rounded-md transition-colors"
                                  title="Balas via WhatsApp"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 uppercase">
              {user?.role?.name || 'Admin'} Panel
            </span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
