
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, isOfflineMode } from '../services/firebase';
import { BankAccount, Transaction } from '../types';
import { getFinancialAdvice } from '../services/gemini';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';

interface AnalysisProps {
  user: User;
}

const Analysis: React.FC<AnalysisProps> = ({ user }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ accounts: BankAccount[], transactions: Transaction[] }>({ accounts: [], transactions: [] });

  const fetchData = async () => {
    if (isOfflineMode) {
      setData({
        accounts: [{ id: '1', balance: 50000, name: '示範', bankName: '國泰', color: '#333', userId: 'd', createdAt: 0 }],
        transactions: []
      });
      return;
    }
    if (db) {
      const qAcc = query(collection(db, 'accounts'), where('userId', '==', user.uid));
      const accSnap = await getDocs(qAcc);
      const accList = accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));

      const qTrans = query(collection(db, 'transactions'), where('userId', '==', user.uid));
      const transSnap = await getDocs(qTrans);
      const transList = transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      
      setData({ accounts: accList, transactions: transList });
    }
  };

  useEffect(() => { fetchData(); }, [user.uid]);

  const generateAdvice = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(data.accounts, data.transactions);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI 智慧分析</h2>
          <p className="text-slate-500">讓 Gemini 根據您的消費習慣給予建議</p>
        </div>
        <button
          onClick={generateAdvice}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
        >
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {advice ? '重新生成建議' : '開始分析'}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden min-h-[400px]">
        {!advice && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 mb-6">
              <BrainCircuit className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">準備好優化您的財務了嗎？</h3>
            <p className="text-slate-500 max-w-sm">點擊上方的「開始分析」按鈕，系統將運用 AI 技術分析您的資產配置與開支，並提供個性化的專業理財建議。</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
             <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
             <p className="text-indigo-600 font-bold">Gemini 正在深入分析您的數據...</p>
          </div>
        )}

        {advice && (
          <div className="prose prose-slate max-w-none">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
               <h3 className="text-xl font-bold m-0">ZenFinance AI 建議報告</h3>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl whitespace-pre-wrap leading-relaxed text-slate-700 italic border-l-4 border-indigo-400">
              {advice}
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-xl text-blue-700 text-sm flex items-start gap-3">
              <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>提示：AI 的分析是基於您提供的歷史數據進行預測與概括。對於重大的投資決策，仍建議諮詢專業理財人員。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
