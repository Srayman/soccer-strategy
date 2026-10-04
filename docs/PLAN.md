# Plan

This is a browser game that teaches a 10-year-old soccer strategy on a top-down pitch.

## How a try works

There are no accounts. Good spots are fixed. The game does not calculate a live better or worse spot.

A move to a spot is a drag. A choice among marked targets is a pick.

The first try shows no hint. A miss shows the answer and ends the attempt. There is no second try inside the attempt. The game shows no pass or fail result.

## Clearing a drill and points

A finished attempt clears a drill, including a miss. Points are separate from clearing. Points are added when the attempt ends.

- A miss adds 1.
- A correct first try adds 3.
- A later ending adds 1 and cannot add 3.

Points reset when the page closes. They are a fun count, not a grade.

## After the try

A correct try shows a short confirmation, does not draw correction spots, and turns on the next-play button. On a miss the button stays off until the answer is on screen. The button plays one fixed animation. There is no physics.

## Tiers

Starters are playable from the start. Next unlocks after every starter is cleared. Advanced unlocks after every next drill is cleared.

## Starter drills

There are 20 starter drills.

Drag:

- Open body
- Get open
- Stay wide. The far player does not run to the ball.
- Spread out. The team uses height, width, and depth.
- Get wide. The wide player stands in the outside channel.
- Help the ball
- Pass and move. This is a drag of the run after the pass.
- Goal-side
- Ball-side
- Mark distance
- Delay
- Pressure and cover. The learner is the cover player.
- Squeeze the middle
- Recovery run
- Goalkeeper step-out and line-up. This is one starter, not three drills. The learner can switch angles before the drag. The angles are central, near post, and through-ball versus a set close shot. Near post is an angle in this drill, not a second drill. The drill is cleared after one ended attempt on each angle.

Pick:

- Check away
- Triangle
- Wall pass
- Switch the weak side
- Build-out

## Next drills

There are 17 next drills. They stay locked until every starter is cleared.

Drag:

- Diagonal run
- Numbers up
- Track
- Slide over. This is a step toward the middle, not a slide tackle.
- Cover shadow
- Simple press triggers. One player and one spot.
- Show outside
- Goalkeeper depth
- Goalkeeper as plus-one
- Counter
- React on turnover

Pick:

- Overlap
- Diagonal ball
- Set and go
- Throw switch
- Corner near and far. One correct marked spot.
- Short corner

## Advanced drills

There are 8 advanced drills. They stay locked until every next drill is cleared.

Drag:

- Offside line step or drop. The pitch is 7v7. The line is the build-out line, not the halfway line. The learner steps the back line up or drops it. This is not an offside trap.
- Zones
- Rest defense
- Counter-press. One player and one spot.
- Between the lines

Pick:

- Third man
- Far-post run
- Swap places

## Out of scope

Accounts, grades, physics, live better-or-worse, offside traps, full team pressing, slide tackles, set-piece encyclopedias, player-written drills, and anything off a top-down pitch.

## Publishing

GitHub Pages deploys the main branch as static HTML, from the repository root, and the game page is index.html at that root.
