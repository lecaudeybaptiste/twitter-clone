import { useState } from "react";
import { db, storage } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";

export default function EditProfileModal({ onClose, profileData }) {
  const { user } = useAuth();
  const [pseudo, setPseudo] = useState(profileData?.pseudo || "");
  const [birthdate, setBirthdate] = useState(profileData?.birthdate || "");
  const [avatarPreview, setAvatarPreview] = useState(profileData?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    let avatarUrl = profileData?.avatar || "";

    // 🔥 Upload image si nouvelle sélection
    if (avatarFile) {
      const avatarRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(avatarRef, avatarFile);
      avatarUrl = await getDownloadURL(avatarRef);
    }

    // 🔥 Mettre à jour Firestore
    await updateDoc(doc(db, "users", user.uid), {
      pseudo,
      birthdate,
      avatar: avatarUrl,
    });

    setLoading(false);
    onClose(); // fermer la modale après sauvegarde
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">Modifier le profil</h2>

        {/* Avatar avec bouton flottant */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={
              avatarPreview ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || "U"}`
            }
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border shadow"
          />
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-black p-2 rounded-full cursor-pointer hover:bg-gray-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        {/* Champs de formulaire */}
        <input
          type="text"
          placeholder="Pseudo"
          className="border p-2 rounded w-full mb-3"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded w-full mb-3"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:bg-gray-400"
        >
          {loading ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}
