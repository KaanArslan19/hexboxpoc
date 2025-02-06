import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Notification = () => {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={5000}
      hideProgressBar={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
    />
  );
};

export default Notification;
