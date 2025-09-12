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
import Reply from "../components/Reply.jsx";

export default function ReplyPage() {
  const { tweetId, replyId } = useParams();
  const { user } = useAuth();

  const [reply, setReply] = useState(null);
  const [nestedReplies, setNestedReplies] = useState([]);
  const [replyText, setReplyText] = useState("");

  // Charger la réponse principale
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "tweets", tweetId, "replies", replyId));
      if (snap.exists()) setReply({ id: snap.id, ...snap.data() });
    })();
  }, [tweetId, replyId]);

  // Charger ses sous-réponses
  useEffect(() => {
    const q = query(
      collection(db, "tweets", tweetId, "replies", replyId, "replies"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (s) =>
      setNestedReplies(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [tweetId, replyId]);

  // Ajouter une sous-réponse
  const handleReply = async (e) => {
    e.preventDefault();
    if (!user) return alert("Connectez-vous pour répondre.");
    if (!replyText.trim()) return;
    await addDoc(
      collection(db, "tweets", tweetId, "replies", replyId, "replies"),
      {
        content: replyText,
        userId: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
      }
    );
    setReplyText("");
  };

  if (!reply) return <div className="max-w-xl mx-auto p-6">Chargement…</div>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      {/* Réponse principale */}
      <Reply
        tweetId={tweetId}
        reply={reply}
        parentPath={`tweets/${tweetId}/replies`}
      />

      {/* Sous-réponses */}
      <h2 className="text-xl font-semibold mt-6 mb-2">
        Réponses à ce commentaire
      </h2>
      <div className="space-y-3">
        {nestedReplies.map((r) => (
          <Reply
            key={r.id}
            tweetId={tweetId}
            reply={r}
            parentPath={`tweets/${tweetId}/replies/${replyId}/replies`}
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
          <button className="bg-black text-white px-4 rounded hover:bg-gray-800">
            Envoyer
          </button>
        </form>
      )}
    </div>
  );
}
