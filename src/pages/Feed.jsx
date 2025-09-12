import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Tweet from "../components/Tweet.jsx";
import TweetBox from "../components/TweetBox.jsx";

export default function Feed() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [activeTab, setActiveTab] = useState("forYou"); // "forYou" ou "following"

  // Charger les utilisateurs suivis
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "follows"),
      where("followerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map((doc) => doc.data().followingId);
      setFollowingIds(ids);
    });
    return () => unsub();
  }, [user]);

  // Charger les tweets en fonction de l’onglet
  useEffect(() => {
    if (activeTab === "following" && followingIds.length === 0) {
      setTweets([]);
      return;
    }

    const baseQuery =
      activeTab === "forYou"
        ? query(collection(db, "tweets"), orderBy("createdAt", "desc"))
        : query(
            collection(db, "tweets"),
            where("userId", "in", [...followingIds, user.uid]), // ✅ inclut aussi mes tweets
            orderBy("createdAt", "desc")
          );

    const unsub = onSnapshot(baseQuery, (snapshot) => {
      setTweets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [activeTab, followingIds, user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-4">Accueil</h1>
        <p className="text-gray-600">Connectez-vous pour voir votre fil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      {/* Onglets */}
      <div className="flex justify-around mb-4 border-b">
        <button
          onClick={() => setActiveTab("forYou")}
          className={`flex-1 py-2 font-medium ${
            activeTab === "forYou"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pour toi
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-2 font-medium ${
            activeTab === "following"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Abonnements
        </button>
      </div>

      {/* Zone pour tweeter */}
      <TweetBox />

      {/* Fil */}
      <h1 className="text-2xl font-bold mb-4 mt-6">Mon fil d’actualité</h1>

      {tweets.length === 0 ? (
        <p className="text-gray-600">Aucun tweet pour l’instant.</p>
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <Tweet key={tweet.id} tweet={tweet} />
          ))}
        </div>
      )}
    </div>
  );
}
