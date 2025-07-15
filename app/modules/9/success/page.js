export default function ModuleNineSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-theme-green">Unit Complete!</h1>
        <p className="text-lg text-theme-dark">
          You’ve successfully submitted your final APA-formatted essay.
        </p>
        <p className="text-theme-dark">Thank you for your hard work!</p>

        <a
          href="/"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}