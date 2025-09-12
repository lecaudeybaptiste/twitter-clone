import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Heart, MessageCircle, Repeat2, Share, Trash2 } from "lucide-react";

export default function Tweet({ tweet }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [likes, setLikes] = useState([]);
  const [retweets, setRetweets] = useState([]);
  const [replyCount, setReplyCount] = useState(0);

  const [author, setAuthor] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasRetweeted, setHasRetweeted] = useState(false);

  const [likeAnimation, setLikeAnimation] = useState(false);
  const [retweetAnimation, setRetweetAnimation] = useState(false);

  // Auteur
  useEffect(() => {
    const fetchAuthor = async () => {
      if (!tweet.userId) return;
      const snap = await getDoc(doc(db, "users", tweet.userId));
      if (snap.exists()) setAuthor({ id: snap.id, ...snap.data() });
    };
    fetchAuthor();
  }, [tweet.userId]);

  // Likes
  useEffect(() => {
    const q = collection(db, "tweets", tweet.id, "likes");
    const unsub = onSnapshot(q, (snapshot) => {
      setLikes(snapshot.docs.map((d) => d.data()));
    });
    return () => unsub();
  }, [tweet.id]);

  // Retweets
  useEffect(() => {
    const q = collection(db, "tweets", tweet.id, "retweets");
    const unsub = onSnapshot(q, (snapshot) => {
      setRetweets(snapshot.docs.map((d) => d.data()));
    });
    return () => unsub();
  }, [tweet.id]);

  // Replies count
  useEffect(() => {
    const q = collection(db, "tweets", tweet.id, "replies");
    const unsub = onSnapshot(q, (snapshot) => setReplyCount(snapshot.size));
    return () => unsub();
  }, [tweet.id]);

  // Flags
  useEffect(() => {
    if (user) setHasLiked(likes.some((l) => l.userId === user.uid));
  }, [likes, user]);

  useEffect(() => {
    if (user) setHasRetweeted(retweets.some((r) => r.userId === user.uid));
  }, [retweets, user]);

  // Like
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return alert("Connectez-vous pour liker.");
    try {
      if (hasLiked) {
        await deleteDoc(doc(db, "tweets", tweet.id, "likes", user.uid));
        await deleteDoc(doc(db, "users", user.uid, "likes", tweet.id));
      } else {
        await setDoc(doc(db, "tweets", tweet.id, "likes", user.uid), {
          userId: user.uid,
          email: user.email,
        });
        await setDoc(doc(db, "users", user.uid, "likes", tweet.id), {
          tweetId: tweet.id,
          createdAt: serverTimestamp(),
        });
        setLikeAnimation(true);
        setTimeout(() => setLikeAnimation(false), 400);
      }
    } catch (err) {
      console.error("❌ Like error:", err);
      alert("Impossible de liker pour le moment.");
    }
  };

  // Retweet
  const handleRetweet = async (e) => {
    e.stopPropagation();
    if (!user) return alert("Connectez-vous pour retweeter.");

    try {
      if (hasRetweeted) {
        setHasRetweeted(false);
        setRetweets((prev) => prev.filter((r) => r.userId !== user.uid));

        await deleteDoc(doc(db, "tweets", tweet.id, "retweets", user.uid));
        await deleteDoc(doc(db, "users", user.uid, "retweets", tweet.id));
      } else {
        setHasRetweeted(true);
        setRetweets((prev) => [
          ...prev,
          { userId: user.uid, email: user.email },
        ]);
        setRetweetAnimation(true);
        setTimeout(() => setRetweetAnimation(false), 400);

        await setDoc(doc(db, "tweets", tweet.id, "retweets", user.uid), {
          userId: user.uid,
          email: user.email,
        });
        await setDoc(doc(db, "users", user.uid, "retweets", tweet.id), {
          tweetId: tweet.id,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("❌ Retweet error:", err);
      setHasRetweeted((v) => !v);
      setRetweets((prev) =>
        hasRetweeted
          ? [...prev, { userId: user.uid, email: user.email }]
          : prev.filter((r) => r.userId !== user.uid)
      );
      alert("Impossible de retweeter pour le moment.");
    }
  };

  // Share
  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      `${window.location.origin}/tweet/${tweet.id}`
    );
    alert("Lien copié !");
  };

  // Delete
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!user || user.uid !== tweet.userId) return;
    if (!window.confirm("Voulez-vous vraiment supprimer ce tweet ?")) return;
    try {
      await deleteDoc(doc(db, "tweets", tweet.id));
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("Suppression impossible pour le moment.");
    }
  };

  return (
    <div
      onClick={() => navigate(`/tweet/${tweet.id}`)}
      className="p-4 border rounded bg-gray-50 shadow-sm mb-4 relative transition hover:bg-gray-100 cursor-pointer"
    >
      {/* Contenu */}
      <p className="text-gray-800">{tweet.content}</p>
      <p className="text-sm text-gray-500 mb-2">
        Par{" "}
        {author ? (
          <Link
            to={`/profile/${author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-black hover:underline"
          >
            {author.pseudo || "Utilisateur"}
          </Link>
        ) : (
          "Utilisateur"
        )}{" "}
        • {tweet.createdAt?.toDate().toLocaleString() || "En cours..."}
      </p>

      {/* Actions */}
      <div className="flex justify-between items-center text-gray-600">
        <div className="flex gap-6">
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1 transition transform hover:scale-110 ${
              hasLiked ? "text-red-500" : " text-gray-500 hover:text-red-500"
            }
            } ${likeAnimation ? "animate-ping-once" : ""}`}
          >
            <Heart size={18} /> {likes.length}
          </button>

          {/* Commentaires */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tweet/${tweet.id}`);
            }}
            className="flex items-center gap-1 transition transform hover:scale-110 hover:text-blue-500"
          >
            <MessageCircle size={18} /> {replyCount}
          </button>

          {/* Retweet */}
          <button
            type="button"
            onClick={handleRetweet}
            className={`flex items-center gap-1 transition transform hover:scale-110 hover:text-green-500 ${
              hasRetweeted ? "text-green-500" : ""
            } ${retweetAnimation ? "animate-ping-once" : ""}`}
          >
            <Repeat2 size={18} /> {retweets.length}
          </button>
        </div>

        {/* À droite : Share + Supprimer */}
        <div className="flex gap-4 items-center">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 transition transform hover:scale-110 hover:text-purple-500"
          >
            <Share size={18} />
          </button>

          {user?.uid === tweet.userId && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 text-black transition transform hover:scale-110 hover:text-black/70"
              title="Supprimer le tweet"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
