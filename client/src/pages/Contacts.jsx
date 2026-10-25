import { useAuth } from "../context/AuthContext";

export default function Contacts() {
  const { user, logout } = useAuth();

  return (
    <div className="p-10">
      <h1 className="font-serif text-3xl text-ink">Hello, {user.name}</h1>
      <p className="mt-2 text-muted">{user.email}</p>
      <button
        onClick={logout}
        className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
      >
        Logout
      </button>
    </div>
  );
}