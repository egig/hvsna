export default function NavActionButton({ ...props }) {
  return (
    <button
      {...props}
      className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg transition-opacity no-select active:scale-95 transition-transform"
    >
      {props.children}
    </button>
  );
}
