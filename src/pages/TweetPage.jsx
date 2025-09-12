// src/pages/TweetPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Tweet from "../components/Tweet.jsx";
import Reply from "../components/Reply.jsx";

export default function TweetPage() {
  const { tweetId } = useParams();
  const { user } = useAuth();

  const [tweet, setTweet] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");

  // Charger le tweet principal
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "tweets", tweetId));
      if (snap.exists()) setTweet({ id: snap.id, ...snap.data() });
    })();
  }, [tweetId]);

  // Charger les réponses de premier niveau
  useEffect(() => {
    const q = query(
      collection(db, "tweets", tweetId, "replies"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (s) =>
      setReplies(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [tweetId]);

  // Ajouter une réponse
  const handleReply = async (e) => {
    e.preventDefault();
    if (!user) return alert("Connectez-vous pour répondre.");
    if (!replyText.trim()) return;
    await addDoc(collection(db, "tweets", tweetId, "replies"), {
      content: replyText,
      userId: user.uid,
      email: user.email,
      createdAt: serverTimestamp(),
    });
    setReplyText("");
  };

  if (!tweet) return <div className="max-w-xl mx-auto p-6">Chargement…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded ">
      {/* Tweet principal */}
      <Tweet tweet={tweet} />

      {/* Section réponses */}
      <h2 className="text-xl font-semibold mt-6 mb-2">Réponses</h2>
      <div className="space-y-3">
        {replies.map((r) => (
          <Reply
            key={r.id}
            tweetId={tweetId}
            reply={r}
            parentPath={`tweets/${tweetId}/replies`} // ✅ point de départ = collection
          />
        ))}
      </div>

      {/* Formulaire réponse */}
      {user && (
        <form onSubmit={handleReply} className="mt-4 flex gap-2">
          <input
            type="text"
            className="border p-2 rounded flex-1"
            placeholder="Répondre…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button className="bg-black text-white py-2 rounded hover:bg-gray-800 transition">
            Envoyer
          </button>
        </form>
      )}
    </div>
  );
}
