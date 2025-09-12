import { Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import Feed from "./pages/Feed.jsx";
import TweetPage from "./pages/TweetPage.jsx";
import ReplyPage from "./pages/ReplyPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Accueil = Feed */}
        <Route index element={<Feed />} />

        {/* Auth */}
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* Profil */}
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="tweet/:tweetId" element={<TweetPage />} />
        <Route path="tweet/:tweetId/reply/:replyId" element={<ReplyPage />} />
      </Route>
    </Routes>
  );
}
