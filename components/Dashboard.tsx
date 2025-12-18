
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, isOfflineMode } from '../services/firebase';
import { BankAccount, Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (isOfflineMode) {
        // Mock data
        const mockAccounts: BankAccount[] = [
          { id: '1', name: '薪轉帳戶', bankName: '國泰世華', balance: 52000, color: '#3b82f6', userId: 'demo', createdAt: Date.now() },
          { id: '2', name: '數位儲蓄', bankName: '台新 Richart', balance: 128000, color: '#10b981', userId: 'demo', createdAt: Date.now() },
        ];
        const mockTransactions: Transaction[] = [
          { id: 't1', accountId: '1', userId: 'demo', amount: 3500, type: TransactionType.EXPENSE, category: '餐飲', note: '晚餐聚會', date: Date.now() - 3600000 },
          { id: 't2', accountId: '2', userId: 'demo', amount: 50000, type: TransactionType.INCOME, category: '薪資', note: '12月薪資', date: Date.now() - 86400000 },
          { id: 't3', accountId: '1', userId: 'demo', amount: 150, type: TransactionType.EXPENSE, category: '交通', note: '捷運', date: Date.now() - 172800000 },
        ];
        setAccounts(mockAccounts);
        setRecentTransactions(mockTransactions);
        setLoading(false);
        return;
      }

      if (db) {
        try {
          const accountsRef = collection(db, 'accounts');
          const qAccounts = query(accountsRef, where('userId', '==', user.uid));
          const querySnapshotAcc = await getDocs(qAccounts);
          const accs = querySnapshotAcc.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
          setAccounts(accs);

          const transRef = collection(db, 'transactions');
          const qTrans = query(transRef, where('userId', '==', user.uid), orderBy('date', 'desc'), limit(5));
          const querySnapshotTrans = await getDocs(qTrans);
          const trans = querySnapshotTrans.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
          setRecentTransactions(trans);
        } catch (e) {
          console.error("Error fetching data:", e);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user.uid]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const categoryData = recentTransactions.reduce((acc: any[], curr) => {
    if (curr.type === TransactionType.EXPENSE) {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
    }
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) return <div className="text-center py-10">讀取中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">歡迎回來</h2>
          <p className="text-slate-500">這是您目前的財務概況</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[240px]">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">總資產淨值</p>
            <p className="text-2xl font-bold text-slate-900">${totalBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">最近活動</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline">查看全部</button>
          </div>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${t.type === TransactionType.INCOME ? 'bg-green-50' : 'bg-red-50'}`}>
                    {t.type === TransactionType.INCOME ? <ArrowUpRight className="text-green-600" /> : <ArrowDownRight className="text-red-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.category}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()} • {t.note || '無備註'}</p>
                  </div>
                </div>
                <div className={`font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-900'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-400 py-8">目前尚無收支紀錄</p>
            )}
          </div>
        </div>

        {/* Expense Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-6">支出分類比例</h3>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic text-sm text-center px-4">
                沒有足夠的支出數據來生成圖表
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
