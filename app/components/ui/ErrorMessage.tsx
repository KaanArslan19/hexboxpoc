import CustomButton from "./CustomButton";

export const ErrorMessage = ({
  title,
  message,
  showRetry = false,
}: {
  title: string;
  message: string;
  showRetry?: boolean;
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      {showRetry && (
        <CustomButton
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-orangeColor/80 text-white rounded-md hover:bg-orangeColor/60 transition-colors border-none"
        >
          Try Again
        </CustomButton>
      )}
    </div>
  </div>
);
