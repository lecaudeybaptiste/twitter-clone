import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Tweet from "../components/Tweet.jsx";

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();

  const [tweets, setTweets] = useState([]);
  const [likedTweets, setLikedTweets] = useState([]);
  const [retweetedTweets, setRetweetedTweets] = useState([]);

  const [profileData, setProfileData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState(null);

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [userFollowingIds, setUserFollowingIds] = useState(new Set());

  const [activeTab, setActiveTab] = useState("posts");

  // --- état modale edit profil ---
  const [showModal, setShowModal] = useState(false);
  const [editPseudo, setEditPseudo] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editCover, setEditCover] = useState("");

  // Charger ou créer l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setProfileData({ id: snap.id, ...data });
        setEditPseudo(data.pseudo || "");
        setEditAvatar(data.avatar || "");
        setEditBirthdate(data.birthdate || "");
        setEditBio(data.bio || "");
        setEditCover(
          data.cover ||
            "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=800&q=80"
        );
      } else {
        await setDoc(ref, {
          email: user?.email || "inconnu",
          pseudo: user?.email?.split("@")[0] || "Utilisateur",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${
            user?.email || "U"
          }`,
          cover:
            "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=800&q=80",
          createdAt: serverTimestamp(),
        });
        const newSnap = await getDoc(ref);
        const data = newSnap.data();
        setProfileData({ id: newSnap.id, ...data });
        setEditPseudo(data?.pseudo || "");
        setEditAvatar(data?.avatar || "");
        setEditBirthdate(data?.birthdate || "");
        setEditBio(data?.bio || "");
        setEditCover(data?.cover || "");
      }
    };
    fetchUser();
  }, [userId, user]);

  // Tweets
  useEffect(() => {
    const q = query(
      collection(db, "tweets"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTweets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [userId]);

  // Likes
  useEffect(() => {
    const fetchLikes = async () => {
      if (!userId) return;
      const likesSnap = await getDocs(collection(db, "users", userId, "likes"));
      const likedTweetIds = likesSnap.docs.map((doc) => doc.id);

      const likedTweetsData = [];
      for (let id of likedTweetIds) {
        const snap = await getDoc(doc(db, "tweets", id));
        if (snap.exists())
          likedTweetsData.push({ id: snap.id, ...snap.data() });
      }
      setLikedTweets(likedTweetsData);
    };
    fetchLikes();
  }, [userId]);

  // Retweets
  useEffect(() => {
    const fetchRetweets = async () => {
      if (!userId) return;
      const retweetsSnap = await getDocs(
        collection(db, "users", userId, "retweets")
      );
      const retweetIds = retweetsSnap.docs.map((doc) => doc.id);

      const retweetsData = [];
      for (let id of retweetIds) {
        const snap = await getDoc(doc(db, "tweets", id));
        if (snap.exists()) retweetsData.push({ id: snap.id, ...snap.data() });
      }
      setRetweetedTweets(retweetsData);
    };
    fetchRetweets();
  }, [userId]);

  // Vérifier follow
  useEffect(() => {
    if (!user) return;
    const checkFollow = async () => {
      const q = query(
        collection(db, "follows"),
        where("followerId", "==", user.uid),
        where("followingId", "==", userId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setIsFollowing(true);
        setFollowDocId(snapshot.docs[0].id);
      } else {
        setIsFollowing(false);
        setFollowDocId(null);
      }
    };
    checkFollow();
  }, [user, userId]);

  // Followers
  useEffect(() => {
    const qFollowers = query(
      collection(db, "follows"),
      where("followingId", "==", userId)
    );
    const unsubscribe = onSnapshot(qFollowers, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const { followerId } = d.data();
          const uSnap = await getDoc(doc(db, "users", followerId));
          return uSnap.exists() ? { id: uSnap.id, ...uSnap.data() } : null;
        })
      );
      setFollowers(list.filter(Boolean));
    });
    return () => unsubscribe();
  }, [userId]);

  // Following
  useEffect(() => {
    const qFollowing = query(
      collection(db, "follows"),
      where("followerId", "==", userId)
    );
    const unsubscribe = onSnapshot(qFollowing, async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const { followingId } = d.data();
          const uSnap = await getDoc(doc(db, "users", followingId));
          return uSnap.exists() ? { id: uSnap.id, ...uSnap.data() } : null;
        })
      );
      setFollowing(list.filter(Boolean));
    });
    return () => unsubscribe();
  }, [userId]);

  // Follow
  const handleFollow = async () => {
    if (!user) return alert("Connectez-vous pour suivre.");
    try {
      const docRef = await addDoc(collection(db, "follows"), {
        followerId: user.uid,
        followerEmail: user.email,
        followerPseudo: user.displayName || profileData?.pseudo || "",
        followerAvatar:
          user.photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${user.email || "U"}`,
        followingId: userId,
        followingEmail: profileData?.email || "",
        followingPseudo: profileData?.pseudo || "",
        followingAvatar: profileData?.avatar || "",
        createdAt: serverTimestamp(),
      });
      setIsFollowing(true);
      setFollowDocId(docRef.id);
    } catch (err) {
      console.error("❌ Erreur lors du suivi :", err.message);
    }
  };

  // Unfollow
  const handleUnfollow = async () => {
    if (!followDocId) return;
    try {
      await deleteDoc(doc(db, "follows", followDocId));
      setIsFollowing(false);
      setFollowDocId(null);
    } catch (err) {
      console.error("❌ Erreur lors du désabonnement :", err.message);
    }
  };

  // Liste des abonnements de l'utilisateur connecté
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "follows"),
      where("followerId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map((doc) => doc.data().followingId));
      setUserFollowingIds(ids);
    });
    return () => unsubscribe();
  }, [user]);

  const isUserFollowing = (targetId) => {
    return userFollowingIds.has(targetId);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded overflow-hidden">
      {/* Couverture */}
      <div className="relative w-full h-40">
        <img
          src={
            profileData?.cover ||
            "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=800&q=80"
          }
          alt="cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <img
            src={
              profileData?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${
                profileData?.email || "U"
              }`
            }
            alt="avatar"
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
          />
        </div>
      </div>

      <div className="px-6 pt-16 pb-6 text-center">
        <h1 className="text-2xl font-bold">
          {profileData?.pseudo || "Utilisateur"}
        </h1>

        {/* Stats */}
        <div className="flex gap-6 mt-4 justify-center">
          <p className="px-3 py-1 rounded-full">
            <span className="font-bold">{tweets.length}</span> Posts
          </p>
          <p
            onClick={() => setShowFollowersModal(true)}
            className="cursor-pointer px-3 py-1 rounded-full transition hover:bg-gray-100"
          >
            <span className="font-bold">{followers.length}</span> Abonnés
          </p>
          <p
            onClick={() => setShowFollowingModal(true)}
            className="cursor-pointer px-3 py-1 rounded-full transition hover:bg-gray-100"
          >
            <span className="font-bold">{following.length}</span> Abonnements
          </p>
        </div>

        {/* Bio */}
        {profileData?.bio && (
          <div className="mt-4 px-4 py-2 bg-gray-50 rounded shadow-sm w-full text-center">
            <p className="text-gray-700">{profileData.bio}</p>
          </div>
        )}

        {/* Boutons */}
        {user && user.uid !== userId ? (
          <div className="mt-4">
            {isFollowing ? (
              <button
                onClick={handleUnfollow}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Se désabonner
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
              >
                Suivre
              </button>
            )}
          </div>
        ) : user ? (
          <div className="mt-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              Modifier le profil
            </button>
          </div>
        ) : null}
      </div>

      {/* Onglets */}
      <div className="grid grid-cols-3 text-center border-b mb-4">
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-2 ${
            activeTab === "posts" ? "border-b-2 border-black" : ""
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          className={`pb-2 ${
            activeTab === "likes" ? "border-b-2 border-black" : ""
          }`}
        >
          Likes
        </button>
        <button
          onClick={() => setActiveTab("retweets")}
          className={`pb-2 ${
            activeTab === "retweets" ? "border-b-2 border-black" : ""
          }`}
        >
          Retweets
        </button>
      </div>

      {/* Contenu onglets */}
      {activeTab === "posts" && (
        <div className="space-y-4 px-6 mb-4">
          {tweets.map((tweet) => (
            <Tweet key={tweet.id} tweet={tweet} />
          ))}
        </div>
      )}

      {activeTab === "likes" && (
        <div className="space-y-4 px-6">
          {likedTweets.length === 0 ? (
            <p className="text-gray-500">Aucun like.</p>
          ) : (
            likedTweets.map((tweet) => <Tweet key={tweet.id} tweet={tweet} />)
          )}
        </div>
      )}

      {activeTab === "retweets" && (
        <div className="space-y-4 px-6">
          {retweetedTweets.length === 0 ? (
            <p className="text-gray-500">Aucun retweet.</p>
          ) : (
            retweetedTweets.map((tweet) => (
              <Tweet key={tweet.id} tweet={tweet} />
            ))
          )}
        </div>
      )}

      {/* Modale edit profil */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Modifier le profil
            </h2>

            <div className="flex flex-col gap-6">
              {/* Couverture */}
              <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                {editCover ? (
                  <img
                    src={editCover}
                    alt="cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Aucun fond d’écran
                  </div>
                )}

                {/* Bouton caméra */}
                <label
                  htmlFor="coverUpload"
                  className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded cursor-pointer flex items-center gap-1 text-sm hover:bg-opacity-80"
                >
                  📷 Modifier
                </label>
                <input
                  id="coverUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setEditCover(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {/* Icône supprimer (❌) */}
                {editCover && (
                  <button
                    onClick={() => setEditCover("")}
                    className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-opacity-90"
                    title="Supprimer le fond"
                  >
                    ✖
                  </button>
                )}
              </div>

              {/* Avatar */}
              <div className="relative self-center">
                <img
                  src={editAvatar || profileData?.avatar}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover border"
                />
                <label
                  htmlFor="avatarUpload"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer"
                >
                  <span className="text-white text-sm font-semibold">📷</span>
                </label>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setEditAvatar(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              {/* Pseudo */}
              <input
                type="text"
                placeholder="Pseudo"
                value={editPseudo}
                onChange={(e) => {
                  let val = e.target.value;
                  // ✅ Ajoute toujours @ au début
                  if (!val.startsWith("@")) {
                    val = "@" + val.replace(/^@+/, "");
                  }
                  setEditPseudo(val);
                }}
                className="border p-2 rounded w-full"
              />

              {/* Bio */}
              <div>
                <textarea
                  placeholder="Biographie"
                  className="border p-2 rounded w-full resize-none"
                  maxLength={160}
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
                <p className="text-right text-sm text-gray-500">
                  {editBio.length}/160
                </p>
              </div>

              {/* Date de naissance */}
              <input
                type="date"
                value={editBirthdate}
                onChange={(e) => setEditBirthdate(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  const ref = doc(db, "users", user.uid);
                  await updateDoc(ref, {
                    pseudo: editPseudo,
                    avatar: editAvatar,
                    bio: editBio,
                    birthdate: editBirthdate,
                    cover: editCover, // ✅ Sauvegarde ou suppression
                  });
                  setProfileData({
                    ...profileData,
                    pseudo: editPseudo,
                    avatar: editAvatar,
                    bio: editBio,
                    birthdate: editBirthdate,
                    cover: editCover,
                  });
                  setShowModal(false);
                  window.location.href = `/profile/${user.uid}`;
                }}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale abonnés */}
      {showFollowersModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Abonnés</h2>
            {followers.length === 0 ? (
              <p className="text-gray-500 text-center">Aucun abonné</p>
            ) : (
              <div className="space-y-3">
                {followers.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                  >
                    {/* Avatar + pseudo */}
                    <Link
                      to={`/profile/${f.id}`}
                      onClick={() => setShowFollowersModal(false)}
                      className="flex items-center gap-3 flex-1 text-black hover:underline"
                    >
                      <img
                        src={
                          f.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${f.pseudo || "U"}`
                        }
                        alt="avatar"
                        className="w-10 h-10 rounded-full"
                      />
                      <span className="font-semibold">
                        {f.pseudo || "Utilisateur"}
                      </span>
                    </Link>

                    {/* Bouton follow/unfollow */}
                    {user &&
                      user.uid !== f.id &&
                      (isUserFollowing(f.id) ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // unfollow
                            const q = query(
                              collection(db, "follows"),
                              where("followerId", "==", user.uid),
                              where("followingId", "==", f.id)
                            );
                            getDocs(q).then((snapshot) => {
                              snapshot.forEach((docSnap) =>
                                deleteDoc(doc(db, "follows", docSnap.id))
                              );
                            });
                          }}
                          className="ml-auto px-3 py-1 text-sm rounded-full bg-black text-white hover:bg-gray-800"
                        >
                          Abonné
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // follow
                            addDoc(collection(db, "follows"), {
                              followerId: user.uid,
                              followerEmail: user.email,
                              followingId: f.id,
                              createdAt: serverTimestamp(),
                            });
                          }}
                          className="ml-auto px-3 py-1 text-sm rounded-full bg-black text-white hover:bg-gray-800"
                        >
                          Suivre
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowFollowersModal(false)}
                className="px-4 py-2 rounded text-white bg-black hover:bg-gray-800 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale abonnements */}
      {showFollowingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Abonnements</h2>
            {following.length === 0 ? (
              <p className="text-gray-500 text-center">Aucun abonnement</p>
            ) : (
              <div className="space-y-3">
                {following.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                  >
                    {/* Avatar + pseudo */}
                    <Link
                      to={`/profile/${f.id}`}
                      onClick={() => setShowFollowingModal(false)}
                      className="flex items-center gap-3 flex-1 text-black hover:underline"
                    >
                      <img
                        src={
                          f.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${f.pseudo || "U"}`
                        }
                        alt="avatar"
                        className="w-10 h-10 rounded-full"
                      />
                      <span className="font-semibold">
                        {f.pseudo || "Utilisateur"}
                      </span>
                    </Link>

                    {/* Bouton follow/unfollow */}
                    {user &&
                      user.uid !== f.id &&
                      (isUserFollowing(f.id) ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // unfollow
                            const q = query(
                              collection(db, "follows"),
                              where("followerId", "==", user.uid),
                              where("followingId", "==", f.id)
                            );
                            getDocs(q).then((snapshot) => {
                              snapshot.forEach((docSnap) =>
                                deleteDoc(doc(db, "follows", docSnap.id))
                              );
                            });
                          }}
                          className="ml-auto px-3 py-1 text-sm rounded-full bg-gray-300 text-black hover:bg-gray-400"
                        >
                          Abonné
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // follow
                            addDoc(collection(db, "follows"), {
                              followerId: user.uid,
                              followerEmail: user.email,
                              followingId: f.id,
                              createdAt: serverTimestamp(),
                            });
                          }}
                          className="ml-auto px-3 py-1 text-sm rounded-full bg-black text-white hover:bg-gray-800"
                        >
                          Suivre
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowFollowingModal(false)}
                className="px-4 py-2 rounded text-white bg-black hover:bg-gray-800 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
