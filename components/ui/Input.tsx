export function Input({ ...props }) {
    return (
      <input
        {...props}
        className="w-full p-3 rounded-xl border border-gray-200
        focus:ring-2 focus:ring-indigo-500 outline-none"
      />
    );
  }