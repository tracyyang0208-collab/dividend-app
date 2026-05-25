import { useEffect, useState } from "react";

export default function App() {
  // fallback ETF 資料
  const fallbackETF: any = {
    "00878": {
      dividend: 0.55,
      frequency: "季配",
      months: [2, 5, 8, 11],
      price: 20.5,
    },

    "00919": {
      dividend: 0.72,
      frequency: "季配",
      months: [1, 4, 7, 10],
      price: 24.8,
    },

    "00713": {
      dividend: 1.5,
      frequency: "季配",
      months: [3, 6, 9, 12],
      price: 48,
    },

    "0056": {
      dividend: 1.07,
      frequency: "季配",
      months: [1, 4, 7, 10],
      price: 37.1,
    },

    "00929": {
      dividend: 0.11,
      frequency: "月配",
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      price: 14,
    },

    "00940": {
      dividend: 0.05,
      frequency: "月配",
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      price: 9,
    },
  };

  // 持股
  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem("dividend-app");

    return saved
      ? JSON.parse(saved)
      : [
          {
            name: "00878",
            shares: "3077",
            dividend: "",
            frequency: "",
            price: "",
            months: [],
            loading: false,
          },
        ];
  });

  // 自動儲存
  useEffect(() => {
    localStorage.setItem("dividend-app", JSON.stringify(stocks));
  }, [stocks]);

  // 更新
  const updateStock = (index: number, field: string, value: any) => {
    const updated = [...stocks];

    updated[index][field] = value;

    setStocks(updated);
  };

  // 新增 ETF
  const addStock = () => {
    setStocks([
      ...stocks,
      {
        name: "",
        shares: "",
        dividend: "",
        frequency: "",
        price: "",
        months: [],
        loading: false,
      },
    ]);
  };

  // 刪除 ETF
  const removeStock = (index: number) => {
    const updated = [...stocks];

    updated.splice(index, 1);

    setStocks(updated);
  };

  // 判斷配息頻率
  const getFrequency = (monthsLength: number) => {
    if (monthsLength >= 12) {
      return "月配";
    }

    if (monthsLength >= 4) {
      return "季配";
    }

    return "半年配";
  };

  // 抓 ETF 資料
  const fetchStockData = async (index: number, stockCode: string) => {
    if (!stockCode) return;

    const updated = [...stocks];

    updated[index].loading = true;

    setStocks([...updated]);

    try {
      let finalCode = stockCode;

      if (!stockCode.includes(".TW")) {
        finalCode = `${stockCode}.TW`;
      }

      const pureCode = finalCode.replace(".TW", "");

      // Yahoo Finance 股價
      let price = 0;

      try {
        const yahooResponse = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${finalCode}`
        );

        const yahooData = await yahooResponse.json();

        price = yahooData?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
      } catch {}

      // FinMind 配息
      let latestDividend = 0;
      let uniqueMonths: any[] = [];
      let frequency = "";

      try {
        const dividendResponse = await fetch(
          `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockDividend&data_id=${pureCode}`
        );

        const dividendData = await dividendResponse.json();

        const dividendList = dividendData?.data || [];

        latestDividend =
          dividendList[dividendList.length - 1]?.cash_dividend || 0;

        const months = dividendList.map((item: any) => {
          const month = new Date(item.ex_dividend_date).getMonth() + 1;

          return month;
        });

        uniqueMonths = [...new Set(months)];

        frequency = getFrequency(uniqueMonths.length);
      } catch {}

      // fallback
      if (!latestDividend && fallbackETF[pureCode]) {
        latestDividend = fallbackETF[pureCode].dividend;

        uniqueMonths = fallbackETF[pureCode].months;

        frequency = fallbackETF[pureCode].frequency;
      }

      if (!price && fallbackETF[pureCode]) {
        price = fallbackETF[pureCode].price;
      }

      updated[index].price = Number(price).toFixed(2);

      updated[index].dividend = latestDividend;

      updated[index].frequency = frequency;

      updated[index].months = uniqueMonths;

      updated[index].loading = false;

      setStocks([...updated]);
    } catch (error) {
      console.error(error);

      updated[index].loading = false;

      setStocks([...updated]);
    }
  };

  // 總股息
  const totalDividend = stocks.reduce((sum: number, stock: any) => {
    const shares = Number(stock.shares) || 0;

    const dividend = Number(stock.dividend) || 0;

    return sum + shares * dividend;
  }, 0);

  // 總市值
  const totalValue = stocks.reduce((sum: number, stock: any) => {
    const shares = Number(stock.shares) || 0;

    const price = Number(stock.price) || 0;

    return sum + shares * price;
  }, 0);

  // 月現金流
  const monthlyCashflow: any = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
  };

  stocks.forEach((stock: any) => {
    const shares = Number(stock.shares) || 0;

    const dividend = Number(stock.dividend) || 0;

    const income = shares * dividend;

    stock.months?.forEach((month: number) => {
      monthlyCashflow[month] += income;
    });
  });

  return (
    <div className="min-h-screen bg-[#f2f2f7] p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold">股息 App</h1>

          <p className="text-gray-500 mt-2">真實 ETF 配息追蹤</p>
        </div>

        {/* 總覽 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="text-gray-500 text-sm">本次總股息</div>

            <div className="text-3xl font-bold mt-2">
              NT$ {totalDividend.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="text-gray-500 text-sm">持股總市值</div>

            <div className="text-3xl font-bold mt-2">
              NT$ {totalValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 月現金流 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-6 overflow-x-auto">
          <div className="text-2xl font-bold mb-5">月現金流</div>

          {/* 第一排 */}
          <div className="flex gap-4 mb-4 min-w-max">
            {[1, 2, 3, 4, 5, 6].map((month) => (
              <div
                key={month}
                className="bg-[#f2f2f7] rounded-2xl p-4 min-w-[140px]"
              >
                <div className="text-gray-500 text-sm">{month} 月</div>

                <div className="text-xl font-bold mt-2">
                  NT$ {monthlyCashflow[month].toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* 第二排 */}
          <div className="flex gap-4 min-w-max">
            {[7, 8, 9, 10, 11, 12].map((month) => (
              <div
                key={month}
                className="bg-[#f2f2f7] rounded-2xl p-4 min-w-[140px]"
              >
                <div className="text-gray-500 text-sm">{month} 月</div>

                <div className="text-xl font-bold mt-2">
                  NT$ {monthlyCashflow[month].toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ETF 表格 */}
        <div className="bg-white rounded-3xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-[#f7f7f7]">
              <tr className="text-left">
                <th className="p-4">ETF名稱</th>
                <th className="p-4">持有股數</th>
                <th className="p-4">每股股息</th>
                <th className="p-4">股價</th>
                <th className="p-4">配息方式</th>
                <th className="p-4">本次股息</th>
                <th className="p-4">年化股息</th>
                <th className="p-4">殖利率</th>
                <th className="p-4">操作</th>
              </tr>
            </thead>

            <tbody>
              {stocks.map((stock: any, index: number) => {
                const shares = Number(stock.shares) || 0;

                const dividend = Number(stock.dividend) || 0;

                const result = shares * dividend;

                let annualDividend = 0;

                if (stock.frequency === "月配") {
                  annualDividend = dividend * 12;
                } else if (stock.frequency === "季配") {
                  annualDividend = dividend * 4;
                } else {
                  annualDividend = dividend * 2;
                }

                const yieldRate =
                  stock.price > 0
                    ? ((annualDividend / Number(stock.price)) * 100).toFixed(2)
                    : 0;

                return (
                  <tr key={index} className="border-t">
                    <td className="p-4">
                      <input
                        type="text"
                        placeholder="00878"
                        value={stock.name}
                        onChange={(e) =>
                          updateStock(index, "name", e.target.value)
                        }
                        className="bg-[#f2f2f7] rounded-xl px-3 py-2 w-[120px] outline-none"
                      />
                    </td>

                    <td className="p-4">
                      <input
                        type="number"
                        placeholder="股數"
                        value={stock.shares}
                        onChange={(e) =>
                          updateStock(index, "shares", e.target.value)
                        }
                        className="bg-[#f2f2f7] rounded-xl px-3 py-2 w-[120px] outline-none"
                      />
                    </td>

                    <td className="p-4">{stock.dividend || "--"}</td>

                    <td className="p-4">{stock.price || "--"}</td>

                    <td className="p-4">{stock.frequency || "-"}</td>

                    <td className="p-4 font-semibold">
                      NT$ {result.toLocaleString()}
                    </td>

                    <td className="p-4">NT$ {annualDividend.toFixed(2)}</td>

                    <td className="p-4">{yieldRate}%</td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchStockData(index, stock.name)}
                          className="bg-black text-white px-4 py-2 rounded-xl"
                        >
                          {stock.loading ? "更新中" : "更新"}
                        </button>

                        <button
                          onClick={() => removeStock(index)}
                          className="bg-red-500 text-white px-4 py-2 rounded-xl"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 新增 */}
        <button
          onClick={addStock}
          className="mt-5 bg-black text-white px-6 py-3 rounded-2xl"
        >
          ＋ 新增 ETF
        </button>
      </div>
    </div>
  );
}
