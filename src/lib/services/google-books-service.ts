interface GoogleBookSearchResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    categories?: string[];
    publishedDate?: string;
    publisher?: string;
    pageCount?: number;
  };
}

export class GoogleBooksService {
  private apiKey: string | undefined;
  private baseUrl = 'https://www.googleapis.com/books/v1/volumes';

  constructor() {
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  }

  async searchBooks(query: string, maxResults: number = 10) {
    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
      ...(this.apiKey && { key: this.apiKey }),
    });

    const response = await fetch(`${this.baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform to our Book format
    return (
      data.items?.map((item: GoogleBookSearchResult) => ({
        externalId: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || [],
        description: item.volumeInfo.description,
        coverImageUrl: item.volumeInfo.imageLinks?.thumbnail,
        genres: item.volumeInfo.categories || [],
        source: 'google-books',
      })) || []
    );
  }
}
