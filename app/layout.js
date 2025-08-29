// app/layout.js
import "./globals.css";
import { Inter } from "next/font/google";
import SessionProvider from "./SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Comp-YouTeacher",
  description: "AI-Enhanced Essay Writing and Grading",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-theme-light text-theme-dark`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <main className="min-h-screen flex flex-col items-center justify-start p-6 sm:p-10">
            <div className="w-full max-w-3xl">{children}</div>
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
