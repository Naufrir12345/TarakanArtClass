import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    namaAnak: '',
    umur: '',
    namaOrtu: '',
    noHpOrtu: '',
    emailOrtu: '',
    instagram: '',
    alamat: '',
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/students?search=${search}&page=${page}&limit=10`);
      setStudents(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error('Error fetching students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, page]);

  const handleOpenModal = (student = null) => {
    if (student) {
      setCurrentStudent(student);
      setFormData({
        namaAnak: student.namaAnak,
        umur: student.umur.toString(),
        namaOrtu: student.namaOrtu,
        noHpOrtu: student.noHpOrtu,
        emailOrtu: student.emailOrtu,
        instagram: student.instagram || '',
        alamat: student.alamat || '',
      });
    } else {
      setCurrentStudent(null);
      setFormData({
        namaAnak: '',
        umur: '',
        namaOrtu: '',
        noHpOrtu: '',
        emailOrtu: '',
        instagram: '',
        alamat: '',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentStudent(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      umur: parseInt(formData.umur),
    };

    try {
      if (currentStudent) {
        await api.patch(`/api/students/${currentStudent.id}`, payload);
      } else {
        await api.post('/api/students', payload);
      }
      fetchStudents();
      handleCloseModal();
    } catch (err) {
      alert('Gagal menyimpan data siswa: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data siswa ini? Semua data pendaftaran, jadwal, dan nilai rapor yang terhubung juga akan dihapus.')) {
      try {
        await api.delete(`/api/students/${id}`);
        fetchStudents();
      } catch (err) {
        alert('Gagal menghapus data siswa');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Data Siswa</h1>
          <p className="text-slate-500 mt-1">Kelola informasi data siswa les anak-anak</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 self-start"
        >
          <Plus size={18} />
          <span>Tambah Siswa</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4 flex items-center">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Cari siswa, nama orang tua, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Anak</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Umur</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Orang Tua</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kontak & Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{student.namaAnak}</td>
                    <td className="px-6 py-4 text-slate-600">{student.umur} Tahun</td>
                    <td className="px-6 py-4 text-slate-600">{student.namaOrtu}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 font-mono text-sm">{student.noHpOrtu}</div>
                      <div className="text-slate-400 text-xs">{student.emailOrtu}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50 hover:bg-white transition-all"
            >
              Sebelumnya
            </button>
            <span className="text-sm text-slate-500 font-medium">
              Halaman {page} dari {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50 hover:bg-white transition-all"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseModal} />
          
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {currentStudent ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Anak
                  </label>
                  <input
                    type="text"
                    required
                    name="namaAnak"
                    value={formData.namaAnak}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Umur
                  </label>
                  <input
                    type="number"
                    required
                    name="umur"
                    value={formData.umur}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Orang Tua
                  </label>
                  <input
                    type="text"
                    required
                    name="namaOrtu"
                    value={formData.namaOrtu}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    No. HP Orang Tua
                  </label>
                  <input
                    type="text"
                    required
                    name="noHpOrtu"
                    value={formData.noHpOrtu}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Orang Tua
                </label>
                <input
                  type="email"
                  required
                  name="emailOrtu"
                  value={formData.emailOrtu}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Instagram (Opsional)
                </label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="@username"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Alamat (Opsional)
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
