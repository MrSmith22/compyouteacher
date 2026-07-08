export default function ReadingLayout({ children }) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        {children}
      </div>
    </div>
  );
}
