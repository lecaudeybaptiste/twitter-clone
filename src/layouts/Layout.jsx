import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, User, MoreHorizontal, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDocs,
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import logo from "../assets/logo-favicon.jpg";
import Loader from "../components/Loader";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showMenu, setShowMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null); // ✅ Données Firestore de l'utilisateur connecté

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Loader
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Charger les données Firestore de l'utilisateur connecté (pseudo, avatar, etc.)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setProfileData(snap.data());
      }
    });
    return () => unsub();
  }, [user]);

  // Charger la liste des utilisateurs suivis
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "follows"),
      where("followerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setFollowing(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  // Charger suggestions Firestore
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      let usersList = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.id !== user.uid); // pas moi-même

      setSuggestions(usersList.slice(0, 5));
    });

    return () => unsub();
  }, [user]);

  // Suivre un profil
  const handleFollow = async (target) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "follows"), {
        followerId: user.uid,
        followerEmail: user.email,
        followingId: target.id,
        followingEmail: target.email,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("❌ Erreur follow :", err.message);
    }
  };

  // Se désabonner
  const handleUnfollow = async (targetId) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "follows"),
        where("followerId", "==", user.uid),
        where("followingId", "==", targetId)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "follows", docSnap.id));
      });
    } catch (err) {
      console.error("❌ Erreur unfollow :", err.message);
    }
  };

  // Vérifier si je suis déjà un user
  const isFollowing = (userId) => {
    return following.some((f) => f.followingId === userId);
  };

  // Loader avant affichage du layout
  if (loading) {
    return <Loader />;
  }

  // on masque la sidebar droite si on est sur /login ou /signup
  const hideRightSidebar =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen bg-white flex justify-center">
      {/* Conteneur global avec 3 colonnes */}
      <div className="flex w-full max-w-7xl">
        {/* Sidebar gauche */}
        <aside className="flex flex-col justify-between bg-white shadow p-2 w-16 md:w-56 sticky top-0 h-screen">
          <div>
            {/* Logo */}
            <Link to="/" className="flex justify-center mb-6">
              <img src={logo} alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
            </Link>

            {/* Navigation */}
            <nav className="flex flex-col gap-6 items-center md:items-start">
              <Link
                to="/"
                className="flex items-center gap-2 text-black px-2 py-2 rounded-full transition hover:bg-gray-100"
              >
                <Home size={22} />
                <span className="hidden md:inline">Accueil</span>
              </Link>

              {user && (
                <Link
                  to={`/profile/${user.uid}`}
                  className="flex items-center gap-2 text-black px-2 py-2 rounded-full transition hover:bg-gray-100"
                >
                  <User size={22} />
                  <span className="hidden md:inline">Profil</span>
                </Link>
              )}

              {!user && (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 text-black px-2 py-2 rounded-full transition hover:bg-gray-100"
                  >
                    <span className="hidden md:inline">Connexion</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 text-black px-2 py-2 rounded-full transition hover:bg-gray-100"
                  >
                    <span className="hidden md:inline">Inscription</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Utilisateur connecté en bas */}
          {user && (
            <div className="relative mt-auto">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex items-center justify-center md:justify-between w-full px-2 py-2 rounded-full transition hover:bg-gray-100"
              >
                <img
                  src={
                    profileData?.avatar ||
                    user.photoURL ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${
                      user.email || "U"
                    }`
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:inline font-medium">
                  {profileData?.pseudo ||
                    user.displayName ||
                    user.email.split("@")[0]}
                </span>
                <MoreHorizontal size={20} className="hidden md:inline" />
              </button>

              {showMenu && (
                <div className="absolute bottom-12 left-0 w-full bg-white border rounded-lg shadow-md">
                  {/* ✅ Icône sur mobile, texte sur desktop */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-gray-100 rounded-lg justify-center md:justify-start"
                  >
                    {/* Icône visible uniquement en mobile */}
                    <LogOut size={18} className="md:hidden" />
                    {/* Texte visible uniquement en desktop */}
                    <span className="hidden md:inline">Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Bloc central */}
        <main className="flex-1 max-w-2xl border-x border-gray-200">
          <div className="p-4">
            <Outlet />
          </div>
        </main>

        {/* Sidebar droite */}
        {!hideRightSidebar && (
          <aside className="hidden lg:flex w-80 p-4 flex-col gap-6 bg-white shadow">
            {/* Suggestions dynamiques */}
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-lg font-bold mb-4">Profils à suivre</h2>
              <div className="flex flex-col gap-3">
                {suggestions.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune suggestion</p>
                ) : (
                  suggestions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      {/* Partie gauche cliquable : avatar + pseudo */}
                      <Link
                        to={`/profile/${s.id}`}
                        className="flex items-center gap-3 flex-1 hover:underline text-black"
                      >
                        <img
                          src={
                            s.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${s.email}`
                          }
                          alt={s.pseudo}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="font-medium whitespace-normal break-words">
                          {s.pseudo || "Utilisateur"}
                        </span>
                      </Link>

                      {/* Bouton follow/unfollow */}
                      {isFollowing(s.id) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnfollow(s.id);
                          }}
                          className="ml-auto px-3 py-1 text-sm rounded-full bg-black text-white hover:bg-gray-800"
                        >
                          Abonné
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(s);
                          }}
                          className="ml-auto px-3 py-1 text-sm rounded-full bg-black text-white hover:bg-gray-800"
                        >
                          Suivre
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
