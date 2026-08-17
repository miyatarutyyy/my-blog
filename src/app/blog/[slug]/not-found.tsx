import { TransitionLink } from "@/src/components/PageTransition";

export default function BlogPostNotFound() {
  return (
    <main>
      <h1>Article not found</h1>
      <p>The requested article does not exist.</p>
      <p>
        <TransitionLink href="/blog">Back to blog index</TransitionLink>
      </p>
    </main>
  );
}
