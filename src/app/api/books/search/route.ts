import { auth } from '@clerk/nextjs/server';
import { GoogleBooksService } from '@/lib/services/google-books-service';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query)
    return Response.json(
      { error: 'Query parameter q is required' },
      { status: 400 }
    );

  try {
    const googleBookService = new GoogleBooksService();
    const books = await googleBookService.searchBooks(query);
    return Response.json({ books });
  } catch (error) {
    console.error('Error searching books', error);
    return Response.json({ error: 'Failed to search books' }, { status: 500 });
  }
}
