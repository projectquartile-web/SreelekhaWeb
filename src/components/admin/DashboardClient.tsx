"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  addMovieAction, renameMovieAction, deleteMovieAction, saveShowsAction, logoutAction,
  saveTrailerAction, clearTrailerAction, resetTrailerAction 
} from "@/app/admin/actions";
import { YouTubeThumbnail, YouTubeModal } from "@/components/YouTubePlayer";

interface Movie {
  id: number;
  name: string;
  youtube_trailer_id?: string | null;
  youtube_trailer_is_manual_override?: number | null;
  youtube_trailer_score?: number | null;
}

interface Show {
  id: number;
  movie_id: number;
  show_time: string;
}

interface MovieWithShows extends Movie {
  shows: Show[];
}

export default function DashboardClient({
  movies,
  schedule,
  selectedDate,
  todayStr,
  tomorrowStr,
}: {
  movies: Movie[];
  schedule: MovieWithShows[];
  selectedDate: string;
  todayStr: string;
  tomorrowStr: string;
}) {
  const router = useRouter();
  const [newMovieName, setNewMovieName] = useState("");

  const handleDateSwitch = (date: string) => {
    router.push(`/admin/dashboard?date=${date}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-md shadow-sm border border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => handleDateSwitch(todayStr)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedDate === todayStr 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            TODAY
          </button>
          <button
            onClick={() => handleDateSwitch(tomorrowStr)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedDate === tomorrowStr 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            TOMORROW
          </button>
        </div>
        
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-red-600 hover:text-red-800 font-medium">
            Log out
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Add New Movie</h2>
        <form action={async (formData) => {
          await addMovieAction(formData);
          setNewMovieName("");
        }} className="flex gap-2">
          <input
            type="text"
            name="name"
            value={newMovieName}
            onChange={(e) => setNewMovieName(e.target.value)}
            placeholder="Movie Title..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            required
          />
          <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800">
            + Add Movie
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {movies.length === 0 ? (
          <p className="text-gray-500 text-center py-8 bg-white rounded-md border border-gray-200">No movies added yet.</p>
        ) : (
          movies.map((movie) => {
            // Find if movie is scheduled today and its times
            const movieSchedule = schedule.find(s => s.id === movie.id);
            const times = movieSchedule ? movieSchedule.shows.map(s => s.show_time) : [];
            
            return (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                times={times} 
                date={selectedDate} 
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function MovieCard({ movie, times, date }: { movie: Movie; times: string[], date: string }) {
  const [editingName, setEditingName] = useState(false);
  const [showTimes, setShowTimes] = useState<string[]>(times);

  // Sync state when props change (like when switching dates)
  React.useEffect(() => {
    setShowTimes(times);
  }, [times, date]);

  const addTime = () => setShowTimes([...showTimes, ""]);
  const removeTime = (index: number) => {
    const newTimes = [...showTimes];
    newTimes.splice(index, 1);
    setShowTimes(newTimes);
  };
  const updateTime = (index: number, val: string) => {
    const newTimes = [...showTimes];
    newTimes[index] = val;
    setShowTimes(newTimes);
  };

  const handleSaveTimes = async () => {
    await saveShowsAction(movie.id, date, showTimes);
    alert("Saved showtimes!");
  };

  const [trailerUrl, setTrailerUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSavingTrailer, setIsSavingTrailer] = useState(false);

  const handleSaveTrailer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTrailer(true);
    try {
      await saveTrailerAction(movie.id, trailerUrl);
      setTrailerUrl("");
      alert("Trailer saved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to save trailer.");
    } finally {
      setIsSavingTrailer(false);
    }
  };

  const handleClearTrailer = async () => {
    if (confirm("Are you sure you want to clear this trailer? It will not be automatically restored unless you 'Reset to Auto'.")) {
      await clearTrailerAction(movie.id);
    }
  };

  const handleResetTrailer = async () => {
    if (confirm("Are you sure you want to allow automatic discovery for this trailer?")) {
      await resetTrailerAction(movie.id);
    }
  };

  return (
    <div className="bg-white p-5 rounded-md shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        {editingName ? (
          <form action={async (formData) => {
            await renameMovieAction(movie.id, formData);
            setEditingName(false);
          }} className="flex gap-2 flex-1 mr-4">
            <input 
              type="text" 
              name="name" 
              defaultValue={movie.name} 
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-black"
              required 
            />
            <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1 rounded">Save</button>
            <button type="button" onClick={() => setEditingName(false)} className="text-xs bg-gray-200 text-gray-800 px-3 py-1 rounded">Cancel</button>
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">{movie.name}</h3>
            <button onClick={() => setEditingName(true)} className="text-xs text-blue-600 hover:underline">Rename</button>
          </div>
        )}
        
        <form action={() => {
          if (confirm(`Are you sure you want to delete ${movie.name}? This will remove all its showtimes.`)) {
            deleteMovieAction(movie.id);
          }
        }}>
          <button type="submit" className="text-red-500 hover:text-red-700 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        </form>
      </div>

      <div className="bg-gray-50 p-4 rounded border border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Showtimes for {date}</h4>
        
        {showTimes.length === 0 && (
          <p className="text-xs text-gray-500 mb-3 italic">No shows scheduled.</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-4">
          {showTimes.map((time, idx) => (
            <div key={idx} className="flex items-center bg-white border border-gray-300 rounded overflow-hidden">
              <input
                type="text"
                value={time}
                onChange={(e) => updateTime(idx, e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="w-28 px-2 py-1 text-sm outline-none text-black"
              />
              <button 
                onClick={() => removeTime(idx)}
                className="bg-gray-100 px-2 py-1 text-gray-500 hover:bg-red-100 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            onClick={addTime}
            className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded border border-blue-200"
          >
            + Add time
          </button>
        </div>

        <button 
          onClick={handleSaveTimes}
          className="bg-black text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800"
        >
          Save Showtimes
        </button>
      </div>

      {/* ── Trailer Management ── */}
      <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">YouTube Trailer</h4>
          <div className="flex gap-2">
            {movie.youtube_trailer_is_manual_override === 1 && (
              <span className="text-[10px] uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-semibold">
                Manual Override
              </span>
            )}
            {movie.youtube_trailer_is_manual_override !== 1 && movie.youtube_trailer_id && (
              <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
                Auto (Score: {movie.youtube_trailer_score || 0})
              </span>
            )}
          </div>
        </div>

        {movie.youtube_trailer_id ? (
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="w-full sm:w-48 aspect-video flex-shrink-0">
              <YouTubeThumbnail 
                videoId={movie.youtube_trailer_id} 
                alt={`${movie.name} Trailer`}
                onClick={() => setModalOpen(true)}
                className="rounded shadow-sm"
              />
            </div>
            <div className="flex flex-col justify-end gap-2 text-sm">
              <p className="text-gray-600 break-all text-xs">ID: {movie.youtube_trailer_id}</p>
              <div className="flex gap-2">
                <button 
                  onClick={handleClearTrailer}
                  className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-medium hover:bg-red-100"
                >
                  Clear Trailer
                </button>
                {movie.youtube_trailer_is_manual_override === 1 && (
                  <button 
                    onClick={handleResetTrailer}
                    className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-100"
                  >
                    Reset to Auto
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-xs text-gray-500 italic mb-2">No trailer found or set.</p>
            {movie.youtube_trailer_is_manual_override === 1 && (
              <button 
                onClick={handleResetTrailer}
                className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-100 mb-2 inline-block"
              >
                Reset to Auto (Allow Discovery)
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSaveTrailer} className="flex flex-col sm:flex-row gap-2 mt-2">
          <input
            type="url"
            value={trailerUrl}
            onChange={(e) => setTrailerUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded outline-none text-black placeholder-gray-400"
            required
          />
          <button 
            type="submit" 
            disabled={isSavingTrailer}
            className="bg-black text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {isSavingTrailer ? "Saving..." : "Save Trailer URL"}
          </button>
        </form>
      </div>

      <YouTubeModal 
        videoId={movie.youtube_trailer_id || null} 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
}
