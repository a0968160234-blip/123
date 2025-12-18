
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db, isOfflineMode } from '../services/firebase';
import { Transaction, BankAccount, TransactionType } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { Plus, Search, Filter } from 'lucide-react';

interface TransactionsProps {
  user: User;
}

const Transactions: React.FC<TransactionsProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    accountId: '',
    amount: 0,
    type: TransactionType.EXPENSE,
    category: DEFAULT_CATEGORIES[0].name,
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    if (isOfflineMode) {
      setAccounts([{ id: '1', name: '薪轉', bankName: '國泰', balance: 5000, color: '#333', userId: 'd', createdAt: 0 }]);
      setLoading(false);
      return;
    }
    if (db) {
      const qAcc = query(collection(db, 'accounts'), where('userId', '==', user.uid));
      const accSnap = await getDocs(qAcc);
      const accList = accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(accList);
      if (accList.length > 0) setFormData(prev => ({ ...prev, accountId: accList[0].id }));

      const qTrans = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));
      const transSnap = await getDocs(qTrans);
      setTransactions(transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId) return alert('請先新增帳戶');

    const transData = {
      ...formData,
      userId: user.uid,
      date: new Date(formData.date).getTime()
    };

    if (isOfflineMode) {
      setTransactions([{ id: Math.random().toString(), ...transData } as any, ...transactions]);
      setIsModalOpen(false);
      return;
    }

    if (db) {
      // 1. 新增交易
      await addDoc(collection(db, 'transactions'), transData);
      
      // 2. 更新帳戶餘額 (簡單實現)
      const accRef = doc(db, 'accounts', formData.accountId);
      const amountChange = formData.type === TransactionType.INCOME ? formData.amount : -formData.amount;
      await updateDoc(accRef, { balance: increment(amountChange) });
      
      fetchData();
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">收支紀錄</h2>
          <p className="text-slate-500">追蹤每一筆日常開銷與收入</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> 新增紀錄
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="搜尋備註或類別..." />
           </div>
           <button className="px-4 py-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-2">
              <Filter className="w-4 h-4" /> 篩選
           </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">日期</th>
              <th className="px-6 py-4">分類</th>
              <th className="px-6 py-4">帳戶</th>
              <th className="px-6 py-4">備註</th>
              <th className="px-6 py-4 text-right">金額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">{t.category}</span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {accounts.find(a => a.id === t.accountId)?.name || '未知帳戶'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{t.note}</td>
                <td className={`px-6 py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-900'}`}>
                   {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="text-center py-20 text-slate-400 italic">尚未有交易紀錄</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">新增收支</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                  onClick={() => setFormData({ ...formData, type: TransactionType.EXPENSE })}
                >
                  支出
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === TransactionType.INCOME ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
                  onClick={() => setFormData({ ...formData, type: TransactionType.INCOME })}
                >
                  收入
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">金額</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">來源/目的帳戶</label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分類</label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {DEFAULT_CATEGORIES.filter(c => c.type === formData.type).map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">備註 (選填)</label>
                <input
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-medium">取消</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">確認儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
