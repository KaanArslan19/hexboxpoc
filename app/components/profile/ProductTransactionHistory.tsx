import React, { useEffect, useState } from "react";
import { ProductFetch } from "@/app/types";
import {
  getUserProductTransactions,
  ProductTransaction,
} from "@/app/utils/poc_utils/getUserProductTransactions";

interface ProductTransactionHistoryProps {
  products: ProductFetch[];
  userAddress: string;
  providerUrl: string;
}

const ProductTransactionHistory: React.FC<ProductTransactionHistoryProps> = ({
  products,
  userAddress,
  providerUrl,
}) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<{
    [productId: number]: ProductTransaction[];
  }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAddress || products.length === 0) return;
    setLoading(true);
    setError(null);
    getUserProductTransactions(products, userAddress, providerUrl)
      .then(setTransactions)
      .catch((err) => setError(err.message || "Failed to fetch transactions"))
      .finally(() => setLoading(false));
  }, [products, userAddress, providerUrl]);

  if (!userAddress)
    return (
      <div className="p-4">
        Connect your wallet to see your product transactions.
      </div>
    );
  if (loading) return <div className="p-4">Loading transaction history...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const productIds = Object.keys(transactions);
  if (productIds.length === 0) {
    return <div className="p-4">No product purchases found.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Product Purchase History</h2>
      {productIds.map((pid) => {
        const txs = transactions[Number(pid)];
        if (!txs || txs.length === 0) return null;
        const product = products.find((p) => p.productId === Number(pid));
        return (
          <div key={pid} className="mb-8">
            <h3 className="text-xl font-semibold mb-2">
              {product?.name || `Product #${pid}`}
            </h3>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">Date</th>
                  <th className="px-4 py-2 border-b">Quantity</th>
                  <th className="px-4 py-2 border-b">Amount</th>
                  <th className="px-4 py-2 border-b">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx) => (
                  <tr key={tx.txHash}>
                    <td className="px-4 py-2 border-b">
                      {tx.timestamp
                        ? new Date(tx.timestamp).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2 border-b">{tx.quantity}</td>
                    <td className="px-4 py-2 border-b">
                      ${tx.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border-b">
                      <a
                        href={`https://testnet.snowtrace.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default ProductTransactionHistory;
