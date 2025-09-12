import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Heart, Repeat2, Share, MessageCircle, Trash2 } from "lucide-react";

export default function Reply({ tweetId, reply, parentPath }) {
  const { user } = useAuth();

  const [likes, setLikes] = useState([]);
  const [retweets, setRetweets] = useState([]);
  const [replyCount, setReplyCount] = useState(0);

  const [author, setAuthor] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasRetweeted, setHasRetweeted] = useState(false);

  const [likeAnimation, setLikeAnimation] = useState(false);
  const [retweetAnimation, setRetweetAnimation] = useState(false);

  // ✅ Chemin du document courant
  const basePath = `${parentPath}/${reply.id}`;

  // Charger auteur depuis Firestore
  useEffect(() => {
    const fetchAuthor = async () => {
      if (!reply.userId) return;
      const snap = await getDoc(doc(db, "users", reply.userId));
      if (snap.exists()) {
        setAuthor({ id: snap.id, ...snap.data() });
      }
    };
    fetchAuthor();
  }, [reply.userId]);

  // Charger likes
  useEffect(() => {
    const q = collection(db, `${basePath}/likes`);
    const unsub = onSnapshot(q, (snapshot) => {
      setLikes(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsub();
  }, [basePath]);

  // Charger retweets
  useEffect(() => {
    const q = collection(db, `${basePath}/retweets`);
    const unsub = onSnapshot(q, (snapshot) => {
      setRetweets(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsub();
  }, [basePath]);

  // Charger le nombre de sous-réponses
  useEffect(() => {
    const q = collection(db, `${basePath}/replies`);
    const unsub = onSnapshot(q, (snapshot) => {
      setReplyCount(snapshot.size);
    });
    return () => unsub();
  }, [basePath]);

  // Vérifier si l’utilisateur a liké
  useEffect(() => {
    if (!user) return;
    setHasLiked(likes.some((l) => l.userId === user.uid));
  }, [likes, user]);

  // Vérifier si l’utilisateur a retweeté
  useEffect(() => {
    if (!user) return;
    setHasRetweeted(retweets.some((r) => r.userId === user.uid));
  }, [retweets, user]);

  // Like
  const handleLike = async () => {
    if (!user) return alert("Connectez-vous pour liker.");
    if (hasLiked) {
      await deleteDoc(doc(db, `${basePath}/likes`, user.uid));
    } else {
      await setDoc(doc(db, `${basePath}/likes`, user.uid), {
        userId: user.uid,
        email: user.email,
      });
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 400);
    }
  };

  // Retweet
  const handleRetweet = async () => {
    if (!user) return alert("Connectez-vous pour retweeter.");
    if (hasRetweeted) {
      await deleteDoc(doc(db, `${basePath}/retweets`, user.uid));
    } else {
      await setDoc(doc(db, `${basePath}/retweets`, user.uid), {
        userId: user.uid,
        email: user.email,
      });
      setRetweetAnimation(true);
      setTimeout(() => setRetweetAnimation(false), 400);
    }
  };

  // Share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Lien copié !");
  };

  // Delete
  const handleDelete = async () => {
    if (!user || user.uid !== reply.userId) return;
    if (!window.confirm("Voulez-vous vraiment supprimer cette réponse ?"))
      return;
    try {
      await deleteDoc(doc(db, parentPath, reply.id));
    } catch (err) {
      console.error("❌ Erreur suppression reply :", err.message);
      alert("Impossible de supprimer pour le moment.");
    }
  };

  return (
    <div className="ml-4 p-3 border-l-2 border-gray-300">
      <div className="p-3 border rounded bg-white shadow-sm">
        {/* Contenu de la réponse cliquable */}
        <Link to={`/tweet/${tweetId}/reply/${reply.id}`}>
          <p className="text-gray-800 cursor-pointer hover:underline">
            {reply.content}
          </p>
        </Link>
        <p className="text-xs text-gray-500 mb-2">
          {author ? (
            <Link
              to={`/profile/${author.id}`}
              className="font-semibold text-black hover:underline"
            >
              {author.pseudo || "Utilisateur"}
            </Link>
          ) : (
            "Utilisateur"
          )}{" "}
          • {reply.createdAt?.toDate().toLocaleString() || "En cours..."}
        </p>

        {/* Barre d’actions */}
        <div className="flex justify-between items-center text-gray-600">
          <div className="flex gap-6">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition transform hover:scale-110 hover:text-red-500 ${
                hasLiked ? "text-red-500" : ""
              } ${likeAnimation ? "animate-ping-once" : ""}`}
            >
              <Heart size={16} /> {likes.length}
            </button>

            {/* Retweet */}
            <button
              onClick={handleRetweet}
              className={`flex items-center gap-1 transition transform hover:scale-110 hover:text-green-500 ${
                hasRetweeted ? "text-green-500" : ""
              } ${retweetAnimation ? "animate-ping-once" : ""}`}
            >
              <Repeat2 size={16} /> {retweets.length}
            </button>

            {/* Commentaire → ouvre ReplyPage */}
            <Link
              to={`/tweet/${tweetId}/reply/${reply.id}`}
              className="flex items-center gap-1 transition transform hover:scale-110 hover:text-blue-500"
            >
              <MessageCircle size={16} /> {replyCount}
            </Link>
          </div>

          {/* À droite : Share + Supprimer */}
          <div className="flex gap-4 items-center">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 transition transform hover:scale-110 hover:text-purple-500"
            >
              <Share size={16} />
            </button>

            {user?.uid === reply.userId && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-black transition transform hover:scale-110 hover:text-black/70"
                title="Supprimer la réponse"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
