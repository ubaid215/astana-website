import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-bold text-primary mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600 mb-8">
        Oops! The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Button asChild className="bg-primary text-white">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
}