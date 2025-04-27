/**
 * Component for the user header section with logout functionality
 */
export default function UserHeader({ user, onLogout }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-gray-600">{user?.email}</p>
      </div>
      <button
        onClick={onLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
