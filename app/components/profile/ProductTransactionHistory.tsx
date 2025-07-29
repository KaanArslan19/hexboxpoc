import React, { useEffect, useState } from "react";
import { ProductFetch } from "@/app/types";
import Link from "next/link";
import { apiFetch } from "@/app/utils/api-client";

interface ProductTransactionHistoryProps {
  userAddress: string;
}

interface UserProductTransaction {
  product: ProductFetch;
  transaction: {
    transactionHash: string;
    blockNumber: string;
    timestamp: string;
    from: string;
    to: string;
    functionName: string;
    args: string[];
    status: string;
  };
}

const ProductTransactionHistory: React.FC<ProductTransactionHistoryProps> = ({
  userAddress,
}) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<UserProductTransaction[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAddress) return;
    setLoading(true);
    setError(null);
    apiFetch(
      `/api/user-owned-products?userAddress=${encodeURIComponent(userAddress)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTransactions(data);
      })
      .catch((err) => setError(err.message || "Failed to fetch transactions"))
      .finally(() => setLoading(false));
  }, [userAddress]);

  if (!userAddress)
    return (
      <div className="p-4">
        Connect your wallet to see your owned product transactions.
      </div>
    );
  if (loading) return <div className="p-4">Loading transaction history...</div>;
  if (error) return <div className="p-4 text-redColor">{error}</div>;

  if (!transactions.length) {
    return <div className="p-4">No owned product transactions found.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        Products You Own
      </h2>

      <div className="space-y-6">
        {transactions.map(({ product, transaction }, idx) => (
          <div
            key={transaction.transactionHash + idx}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Product Header */}
            <div className=" bg-blueColor/80 px-6 py-4">
              <h3 className="text-xl font-bold text-white">
                {product.name || `Product #${product.productId}`}
              </h3>
              {product.description && (
                <p className="text-blue-100 mt-1 text-sm">
                  {product.description}
                </p>
              )}
            </div>

            {/* Transaction Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Date */}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Date
                  </span>
                  <span className="text-sm text-gray-800 font-medium">
                    {transaction.timestamp
                      ? new Date(transaction.timestamp).toLocaleDateString()
                      : "-"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {transaction.timestamp
                      ? new Date(transaction.timestamp).toLocaleTimeString()
                      : ""}
                  </span>
                </div>

                {/* Function */}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Function
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                    {transaction.functionName}
                  </span>
                </div>

                {/* Product ID */}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Product ID
                  </span>
                  <Link href={`/product?productId=${product.id}`}>
                    <span className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded w-fit">
                      #{product.productId}
                    </span>
                  </Link>
                </div>

                {/* Status */}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                      transaction.status?.toLowerCase() === "success"
                        ? "bg-green-100 text-green-700"
                        : transaction.status?.toLowerCase() === "pending"
                        ? "bg-yellow-100 text-yellowColor"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Transaction Hash
                  </span>
                  <a
                    href={`https://testnet.snowtrace.io/tx/${transaction.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blueColor/80  hover:text-blueColor transition-colors group"
                  >
                    <span className="font-mono text-sm">
                      {transaction.transactionHash.slice(0, 10)}...
                      {transaction.transactionHash.slice(-8)}
                    </span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            No transactions found
          </div>
          <div className="text-gray-500 text-sm">
            Your owned products will appear here once you make a purchase.
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTransactionHistory;
