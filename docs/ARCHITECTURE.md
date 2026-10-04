# Architecture

## Drill catalog

The game has one drill catalog. Each drill is a drag or a pick, and it sits in starter, next, or advanced.

A drag attempt and a pick attempt each use three states: playing, correct, and miss.

Only miss carries answer spots. Correct shows the line "You found a spot." and draws no correction spots.

## Progress and points

Progress records a finished attempt and whether a tier is unlocked.

A finished attempt clears that drill, including a miss. Next stays locked until every starter is cleared. Advanced stays locked until every next drill is cleared.

Goalkeeper step-out is one starter drill with three pictures. The ended list gains that drill only after one attempt has ended on each picture. One ended picture leaves it off the list. Switching pictures before the drag does not count as an ended attempt. Points totals stay the same. Other drills still join the ended list on one ended attempt.

Points are awarded when the attempt ends. A miss adds 1. A correct first try adds 3. A later ending adds 1 and cannot add 3.

The goalkeeper first-try key is the drill plus the angle. Other drills use the drill id.

## Settle

One settle step writes progress and points. The page does not judge spots.

There is no saved storage, so points reset when the page closes.

## Publishing

GitHub Pages deploys the main branch as static HTML, from the repository root, and the game page is index.html at that root.
