import { Movie } from "@/lib/types/movie";

export const moviesData: Movie[] = [
  {
    id: "movie-1",
    titleKey: "movies.movie1.title",
    genreKey: "movies.movie1.genre",
    duration: "2h 45m",
    poster: "/placeholders/movie1.jpg",
    timings: ["10:30 AM", "1:30 PM", "4:30 PM", "7:30 PM", "10:30 PM"],
    bookingUrl: "https://in.bookmyshow.com", // Example URL
  },
  {
    id: "movie-2",
    titleKey: "movies.movie2.title",
    genreKey: "movies.movie2.genre",
    duration: "2h 30m",
    poster: "/placeholders/movie2.jpg",
    timings: ["10:00 AM", "1:15 PM", "4:15 PM", "7:15 PM", "10:15 PM"],
    bookingUrl: "https://in.bookmyshow.com",
  },
  {
    id: "movie-3",
    titleKey: "movies.movie3.title",
    genreKey: "movies.movie3.genre",
    duration: "2h 20m",
    poster: "/placeholders/movie3.jpg",
    timings: ["10:45 AM", "2:00 PM", "5:00 PM", "8:00 PM", "11:00 PM"],
    bookingUrl: "https://in.bookmyshow.com",
  },
  {
    id: "movie-4",
    titleKey: "movies.movie4.title",
    genreKey: "movies.movie4.genre",
    duration: "2h 52m",
    poster: "/placeholders/movie4.jpg",
    timings: ["11:00 AM", "2:30 PM", "6:00 PM", "9:30 PM"],
    bookingUrl: "https://in.bookmyshow.com",
  },
];
