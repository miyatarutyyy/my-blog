import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The requested page does not exist.</p>
      <p>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
