
import { GoogleGenAI } from "@google/genai";
import { Transaction, BankAccount } from "../types";

const apiKey = process.env.API_KEY;

export const getFinancialAdvice = async (
  accounts: BankAccount[],
  transactions: Transaction[]
): Promise<string> => {
  if (!apiKey || apiKey === '') {
    return "目前處於離線模式或未設定 API Key，無法提供 AI 建議。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // 整理數據給 AI
    const summary = {
      totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
      accountCount: accounts.length,
      recentTransactions: transactions.slice(0, 10).map(t => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
        note: t.note
      }))
    };

    const prompt = `
      作為一個資深的專業理財顧問，請分析以下財務狀況並給予具體建議：
      帳戶總餘額: ${summary.totalBalance}
      帳戶數量: ${summary.accountCount}
      最近交易紀錄: ${JSON.stringify(summary.recentTransactions)}
      
      請提供：
      1. 支出分布的觀察。
      2. 一個具體的省錢或投資建議。
      3. 對於目前財務健康狀況的簡短評語（100字以內）。
      請使用繁體中文回答。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });

    return response.text || "AI 無法生成建議，請稍後再試。";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "獲取 AI 建議時發生錯誤。";
  }
};
