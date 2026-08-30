export interface Movie {
  id: string;
  titleKey: string;     // Key to look up the movie title in translation files
  genreKey: string;     // Key to look up the genre
  duration: string;     // e.g. "2h 45m"
  poster: string;       // Path to local image or placeholder
  timings: string[];    // Array of show times, e.g. ["10:30 AM", "2:15 PM", "6:00 PM", "9:30 PM"]
  bookingUrl: string;   // Link to external ticketing service if available, or WhatsApp callback
}
