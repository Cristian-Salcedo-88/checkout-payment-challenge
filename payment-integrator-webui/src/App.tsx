import { Navigate, Route, Routes } from 'react-router-dom';

import CheckoutPage from './features/checkout/CheckoutPage';
import SummaryPage from './features/payment/SummaryPage';
import ProductPage from './features/product/ProductPage';
import ResultPage from './features/result/ResultPage';

// 5 screens from the spec map to 4 routes: the final "redirect to product
// with fresh stock" step re-lands on "/", which re-fetches on mount.
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/summary" element={<SummaryPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
