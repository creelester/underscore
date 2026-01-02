import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const books = await prisma.book.findMany();
  return Response.json(books);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json(); // the books passed in the body of the request
    if (!body.title || !body.authors || !body.source) {
      return Response.json(
        { error: 'Title, authors and source are required' },
        { status: 400 }
      );
    }
    //check if book exists already
    if (body.externalId) {
      const existing = await prisma.book.findUnique({
        where: {
          source_externalId: {
            source: body.source,
            externalId: body.externalId,
          },
        },
      });
      if (existing) {
        return Response.json({ existing });
      }

      const book = await prisma.book.create({
        data: {
          title: body.title,
          authors: body.authors,
          description: body.description,
          coverImageUrl: body.coverImageUrl,
          genres: body.genres || [],
          source: body.source,
          externalId: body.externalId,
        },
      });
      return Response.json(book, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating book:', error);
    return Response.json({ error: 'Failed to create book' }, { status: 500 });
  }
}
