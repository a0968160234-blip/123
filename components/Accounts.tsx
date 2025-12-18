
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, isOfflineMode } from '../services/firebase';
import { BankAccount } from '../types';
import { Plus, Trash2, Edit2, CreditCard } from 'lucide-react';
import { APP_COLORS } from '../constants';

interface AccountsProps {
  user: User;
}

const Accounts: React.FC<AccountsProps> = ({ user }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', bankName: '', balance: 0, color: APP_COLORS[0] });

  const fetchAccounts = async () => {
    if (isOfflineMode) {
      setAccounts([
        { id: '1', name: '主要往來', bankName: '國泰世華', balance: 45000, color: '#3b82f6', userId: user.uid, createdAt: Date.now() },
        { id: '2', name: '旅遊基金', bankName: 'Line Bank', balance: 12000, color: '#10b981', userId: user.uid, createdAt: Date.now() }
      ]);
      setLoading(false);
      return;
    }

    if (db) {
      const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const accs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(accs);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user.uid]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOfflineMode) {
      const newAcc: BankAccount = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        userId: user.uid,
        createdAt: Date.now()
      };
      setAccounts([...accounts, newAcc]);
      setIsModalOpen(false);
      return;
    }

    if (db) {
      await addDoc(collection(db, 'accounts'), {
        ...formData,
        userId: user.uid,
        createdAt: Date.now()
      });
      fetchAccounts();
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此帳戶嗎？所有關聯紀錄將不再顯示。')) {
      if (isOfflineMode) {
        setAccounts(accounts.filter(a => a.id !== id));
        return;
      }
      if (db) {
        await deleteDoc(doc(db, 'accounts', id));
        fetchAccounts();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">帳戶管理</h2>
          <p className="text-slate-500">管理您的銀行存款與資產</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" /> 新增帳戶
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <div className="h-2 w-full" style={{ backgroundColor: acc.color }}></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(acc.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{acc.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{acc.bankName}</p>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">當前餘額</p>
                <p className="text-2xl font-bold text-slate-800">${acc.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">新增銀行帳戶</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">帳戶名稱</label>
                <input
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例如：薪轉、存股帳戶..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">銀行/機構名稱</label>
                <input
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例如：中國信託、郵局..."
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">初始餘額</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">代表顏色</label>
                <div className="flex gap-2">
                  {APP_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === c ? 'border-slate-800' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormData({ ...formData, color: c })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
