# Train Mania 🚂

Train Mania is a bright, arcade-style browser puzzle inspired by classic **Pipe Mania** mechanics.

## Features

- Tutorial-friendly first stage with a **4x4 grid**.
- Place randomly generated rail tiles (straight + curved) to connect stations.
- **60-second countdown** before the train departs.
- Train moves slowly and keeps moving while you continue placing tracks.
- Win popup / achievement screen and automatic progression to the next round.
- Local **leaderboard** stored in your browser (`localStorage`).
- Custom original SVG sprites (logo, train, stations, tracks, timer badge).
- Dedicated **About** page.
- Licensed under **GNU GPL v3.0**.

## Run locally

Because this is a static project, you can run with any local server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Controls

1. Look at **Next Tile**.
2. Click an empty grid cell to place it.
3. Keep building before and after the train starts.
4. Guide the train from the start station (top-left) to the destination (bottom-right).

Enjoy building tracks! 🚄
