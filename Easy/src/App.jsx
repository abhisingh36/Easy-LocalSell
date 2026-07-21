import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Toast from './components/toast/Toast';
import LoginModal from './components/loginModal/LoginModal';
import LocationModal from './components/locationModal/LocationModal';
import Home from './pages/homePage/homePage';
import Listing from './pages/listingDetails/listing';
import PostItem from './pages/postItem/postitem';
import Messages from './pages/messages/Messages';
import Profile from './pages/profile/ProfilePage';

function App() {
  return (
    <AppProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/"         element={<Navigate to="/home" replace />} />
          <Route path="/home"     element={<Home />} />
          <Route path="/listing"  element={<Listing />} />
          <Route path="/post"     element={<PostItem />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile"  element={<Profile />} />
        </Routes>

        {/* Global modals & toasts */}
        <LoginModal />
        <LocationModal />
        <Toast />
      </Router>
    </AppProvider>
  );
}

export default App;
