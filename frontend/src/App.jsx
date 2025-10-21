import React from "react";
import './index.css';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from "./pages/Home";
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail'
import DashboardLayout from "./components1/DashboardLayout";
import Form from "./pages/SalesForm";
import Pform from "./pages/PurchasesForm";
import Onboarding from "./pages/AfterSignup";
import { CartProvider } from "./contexts/CartContext";
import Forgotpassword from "./pages/Forgotpassword";
import Resetpassword from "./pages/Resetpassword";
import NotFound from "./pages/Notfound";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components1/ProtectedRoute';

function App() {
  return (
    <>
    <ToastContainer />

    <Router>
      <Routes>
          <Route path="/" element={ <Home />}></Route>
          <Route path="/login" element={ <ProtectedRoute requireAuth={false}><Login /></ProtectedRoute> }></Route>
          <Route path="/signup" element={ <ProtectedRoute requireAuth={false} isSignup={true}><Signup /></ProtectedRoute> }></Route>
          <Route path='/email' element={<VerifyEmail />}></Route>
          <Route path='/dashboard' element={
            <ProtectedRoute>
              <CartProvider>
                <DashboardLayout />
              </CartProvider>
            </ProtectedRoute>
          }></Route>
          <Route path='/salesdata' element={<Form />}></Route>
          <Route path='/purchasedata' element={<Pform />}></Route>
          <Route path='/land' element={<Onboarding />}></Route>
          <Route path='/forgotpassword' element={<Forgotpassword />}></Route>
          <Route path='/resetpassword' element={<Resetpassword />}></Route>
          <Route path='*' element={<NotFound />}></Route>
      </Routes>
    </Router>
     
    </>
  )
}

export default App;
