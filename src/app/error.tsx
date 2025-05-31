
'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
     <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-4">
        <Card className="w-full max-w-lg border-destructive">
             <CardHeader className="text-center">
               <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
               <CardTitle className="text-destructive">Something went wrong!</CardTitle>
               <CardDescription>
                 We encountered an unexpected error. Please try again.
               </CardDescription>
             </CardHeader>
             <CardContent className="text-center">
                 <p className="text-sm text-muted-foreground mb-4">Error details (for debugging): {error.message}</p>
             </CardContent>
             <CardFooter className="flex justify-center">
                 <Button
                    onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                    }
                    variant="destructive"
                 >
                    Try again
                 </Button>
             </CardFooter>
        </Card>
     </div>

  )
}
