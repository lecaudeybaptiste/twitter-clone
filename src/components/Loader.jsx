import logo from "../assets/logo-favicon.jpg";

export default function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <img src={logo} alt="Chargement..." className="w-16 h-16 animate-pulse" />
    </div>
  );
}
