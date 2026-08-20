import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
      <h2 className="mb-6 text-2xl font-semibold">Page Not Found</h2>
      <p className="mb-8 text-muted-foreground">The page you are looking for doesn't exist or has been moved.</p>
      <Link href="/">
        <Button size="lg">Go Home</Button>
      </Link>
    </div>
  )
}
