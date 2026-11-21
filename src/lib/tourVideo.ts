/**
 * The product tour video. Kept out of the client components so the server
 * can read it too: the /tour page puts these paths in its metadata and video
 * structured data, and a value imported from a "use client" file is only a
 * reference on the server (it rendered as "/undefined").
 */
export const TOUR_VIDEO = {
  src: "/videos/intuition-rewire-tour-v4.mp4",
  poster: "/videos/tour-poster-v2.jpg",
  label:
    "IntuitionRewire product tour: the homepage in light and dark mode, a lesson walkthrough, a BST insert dry run and the 3D memory board",
};
