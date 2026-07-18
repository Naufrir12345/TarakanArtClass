import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ManajemenKelas() {
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        const res = await axios.get('/api/classes');
        setClasses(res.data);
    };

    const deleteClass = async (id) => {
        if (confirm('Hapus kelas ini?')) {
            await axios.delete(`/api/classes/${id}`);
            fetchClasses();
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Manajemen Kelas</h1>
            <table className="w-full bg-white shadow rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 text-left">Nama Kelas</th>
                        <th className="p-3 text-left">Harga</th>
                        <th className="p-3 text-left">Jadwal</th>
                        <th className="p-3 text-left">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {classes.map((cls) => (
                        <tr key={cls.id} className="border-t">
                            <td className="p-3">{cls.name}</td>
                            <td className="p-3">Rp {Number(cls.price).toLocaleString()}</td>
                            <td className="p-3">{cls.schedule?.join(', ')} ({cls.startTime}-{cls.endTime})</td>
                            <td className="p-3">
                                <button onClick={() => deleteClass(cls.id)} className="text-red-500">Hapus</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}