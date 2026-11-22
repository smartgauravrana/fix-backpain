// Exercise library. Animations use the pose model documented in figure.js.
// place: minimum environment needed — 'anywhere' (standing/chair) < 'floor' (mat) < 'gym' (band/weights)
// dose: reps = animation loops per set; secs = timed hold. sides: 1 or 2.

export const PILLARS = {
  relieve:    { name: 'Relieve',    color: 'var(--p-relieve)',    blurb: 'Calm the nerve, ease pain, centralise symptoms' },
  stabilize:  { name: 'Stabilise',  color: 'var(--p-stabilize)',  blurb: 'Core endurance that protects the spine' },
  strengthen: { name: 'Strengthen', color: 'var(--p-strengthen)', blurb: 'Functional patterns: hinge, squat, lunge, carry, walk' },
  mobilize:   { name: 'Mobilise',   color: 'var(--p-mobilize)',   blurb: 'Flexibility and joint health for prevention' },
};
export const PLACES = {
  anywhere: { name: 'Anywhere', hint: 'Standing or chair — office-friendly' },
  floor:    { name: 'Floor',    hint: 'A mat or carpet' },
  gym:      { name: 'Gym',      hint: 'Band / cable / dumbbell' },
};

// ---------- base poses ----------
const STAND = { x: 180, y: 156, t: 180, c: 0, n: 180, a1: 6, e1: 12, a2: -4, e2: 4, L1: [184, 246], L2: [177, 246], f1: 90, f2: 90 };
const SUPINE = { x: 210, y: 242, t: -90, c: 0, n: -95, a1: 86, e1: 90, a2: 88, e2: 92, L1: [257, 246], L2: [251, 246], f1: 92, f2: 92 };
const PRONE = { x: 150, y: 240, t: 116, c: 0, n: 110, A1: [239, 246], A2: [235, 246], L1: [60, 243], L2: [61, 246], bL1: -1, bL2: -1, f1: -85, f2: -85 };
const QUAD = { x: 140, y: 200, t: 108, c: 0, n: 100, A1: [202, 246], A2: [198, 246], L1: [96, 246], L2: [92, 246], f1: -90, f2: -90 };
const SEATED = { x: 172, y: 201, t: 180, c: 0, n: 180, a1: -4, e1: 8, a2: -6, e2: 6, L1: [222, 246], L2: [217, 246], f1: 90, f2: 90 };
const CHAIR = { type: 'chair', x: 124, w: 76, seat: 210, back: 150 };
const MAT = { type: 'mat' };

export const EXERCISES = [
  // ======================= RELIEVE =======================
  {
    id: 'nerve-floss-seated', name: 'Seated sciatic nerve floss', pillar: 'relieve', place: 'anywhere', equip: 'Chair',
    objective: 'Gently slide the sciatic nerve through its tunnel to reduce leg pain, tingling and nerve sensitivity.',
    muscles: ['Sciatic nerve', 'Hamstrings', 'Calf'], focus: ['leg1'],
    cues: ['Sit tall at the front of the chair, hands on the seat edge.', 'Straighten the knee and pull your toes up while you look UP.', 'Bend the knee and drop your chin as the foot comes down.', 'Smooth and rhythmic — it should feel like a gentle stretch, never sharp.'],
    avoid: ['Holding the stretch at end range', 'Forcing through tingling or zinging pain'],
    safety: 'Symptoms may tingle briefly but should settle within a minute. If leg pain lingers or spreads, do fewer, smaller reps.',
    dose: { reps: 10, sets: 2, sides: 2 },
    props: [CHAIR],
    anim: {
      base: { ...SEATED, L1: null, h1: 88, k1: 0, t: 176, c: 0.35 },
      frames: [
        { n: 145, k1: 2, f1: 92, _h: 300, _d: 1200 },
        { n: 198, k1: 72, f1: 168, _h: 300, _d: 1200 },
      ],
    },
  },
  {
    id: 'nerve-glide-supine', name: 'Supine nerve glide', pillar: 'relieve', place: 'floor', equip: 'Mat',
    objective: 'Mobilise the sciatic nerve from a supported, unloaded position — great on flare-up days.',
    muscles: ['Sciatic nerve', 'Hamstrings', 'Calf'], focus: ['leg1'],
    cues: ['Lie on your back and hold behind the thigh, hip at 90°.', 'Slowly straighten the knee while pulling the toes toward you.', 'Bend back to the start. Keep the other foot planted.', 'Only go to the first point of tension.'],
    avoid: ['Pulling the thigh closer to force a stretch', 'Holding your breath'],
    safety: 'A mild pulling sensation is fine. Sharp or lingering leg pain means reduce the range.',
    dose: { reps: 10, sets: 2, sides: 2 },
    props: [MAT],
    anim: {
      base: { ...SUPINE, L1: null, h1: 180, k1: 90, f1: 175, A1: [207, 216], A2: [205, 219], bA1: 1, bA2: 1, n: -100 },
      frames: [
        { k1: 92, f1: 176, _h: 200, _d: 1500 },
        { k1: 176, f1: 262, _h: 200, _d: 1500 },
      ],
    },
  },
  {
    id: 'prone-press-up', name: 'Prone press-up (McKenzie)', pillar: 'relieve', place: 'floor', equip: 'Mat',
    objective: 'Repeated gentle extension that often "centralises" leg pain — pulling it out of the leg back toward the spine.',
    muscles: ['Lumbar spine', 'Spinal erectors (relaxed)'], focus: ['torso'],
    cues: ['Start propped on your forearms, hips relaxed on the floor.', 'Press up through the hands, letting the low back sag.', 'Keep the hips and glutes completely relaxed.', 'Breathe out at the top, then lower slowly.'],
    avoid: ['Lifting the hips off the floor', 'Squeezing the glutes'],
    safety: 'Good sign: leg pain shrinks or moves toward the back. Stop if pain moves further DOWN the leg.',
    dose: { reps: 10, sets: 2, sides: 1 },
    props: [MAT],
    anim: {
      base: { ...PRONE },
      frames: [
        { t: 116, n: 108, c: 0, _h: 400, _d: 1400 },
        { t: 135, n: 160, c: -0.7, x: 150, _h: 1000, _d: 1400 },
      ],
    },
  },
  {
    id: 'standing-extension', name: 'Standing back extension', pillar: 'relieve', place: 'anywhere', equip: 'None',
    objective: 'An office-friendly reset after sitting: reverses the slumped posture and can ease disc-related pain.',
    muscles: ['Lumbar spine', 'Hip flexors'], focus: ['torso'],
    cues: ['Stand tall, feet hip-width, hands on the back of your pelvis.', 'Push the hips forward and lean back gently.', 'Look slightly up; hold for a breath.', 'Return to tall standing.'],
    avoid: ['Bending the knees a lot', 'Cranking the neck back'],
    safety: 'Use after long sitting. Skip if extension makes leg symptoms worse.',
    dose: { reps: 8, sets: 2, sides: 1 },
    anim: {
      base: { ...STAND, A1: [170, 154], A2: [167, 156] },
      frames: [
        { _h: 300, _d: 1200 },
        { x: 187, t: 200, c: -0.55, n: 208, A1: [177, 156], A2: [174, 158], _h: 1200, _d: 1200 },
      ],
    },
  },
  {
    id: 'cat-camel', name: 'Cat–camel', pillar: 'relieve', place: 'floor', equip: 'Mat',
    objective: 'Floss the spine through a gentle, pain-free range to reduce stiffness — motion, not stretch.',
    muscles: ['Spinal segments', 'Erector spinae', 'Abdominals'], focus: ['torso'],
    cues: ['Hands under shoulders, knees under hips.', 'Round the back up, tucking chin and tail.', 'Then let the belly drop and look forward.', 'Slow, easy cycles — don\'t push into end range.'],
    avoid: ['Forcing end-range positions', 'Rushing'],
    safety: 'Keep it gentle. This is a warm-up for the spine, not a stretch.',
    dose: { reps: 8, sets: 1, sides: 1 },
    props: [MAT],
    anim: {
      base: { ...QUAD },
      frames: [
        { c: 1.0, n: 35, y: 198, _h: 200, _d: 1600 },
        { c: -0.8, n: 145, y: 202, _h: 200, _d: 1600 },
      ],
    },
  },
  {
    id: 'breathing-9090', name: '90/90 belly breathing', pillar: 'relieve', place: 'floor', equip: 'Chair or box',
    objective: 'Down-regulate a sensitised nervous system and re-train the diaphragm as a core stabiliser.',
    muscles: ['Diaphragm', 'Deep core', 'Pelvic floor'], focus: ['torso'],
    cues: ['Lie with calves on a chair, hips and knees at 90°.', 'Inhale through the nose for 4 — the belly rises first.', 'Exhale slowly for 6, ribs softening down.', 'Let the low back relax into the floor.'],
    avoid: ['Lifting the chest and shoulders to breathe', 'Arching the back'],
    safety: 'Very safe. Ideal on high-pain days or before sleep.',
    dose: { reps: 6, sets: 1, sides: 1 },
    props: [MAT, { type: 'box', x: 232, y: 205, w: 64 }],
    anim: {
      base: { ...SUPINE, L1: [256, 197], L2: [254, 199], f1: 178, f2: 178, A1: [198, 231], A2: [171, 232], bA1: 1, bA2: 1 },
      frames: [
        { c: 0, _h: 500, _d: 4000 },
        { c: -0.3, A1: [198, 225], A2: [171, 229], _h: 500, _d: 6000 },
      ],
    },
  },

  // ======================= STABILISE =======================
  {
    id: 'curl-up', name: 'McGill curl-up', pillar: 'stabilize', place: 'floor', equip: 'Mat',
    objective: 'Build abdominal endurance while keeping the lumbar spine neutral — no crunching of the low back.',
    muscles: ['Rectus abdominis', 'Obliques'], focus: ['torso'],
    cues: ['One knee bent, one leg straight; hands under your low back.', 'Brace lightly, then lift head and shoulders just an inch.', 'Keep the neck long — chin stays in line with chest.', 'Hold 8–10 s, breathing, then lower. Switch legs each set.'],
    avoid: ['Flattening the low back into your hands', 'Pulling with the neck'],
    safety: 'Part of the McGill "Big 3". The low back should not move.',
    dose: { reps: 5, sets: 3, sides: 1 },
    props: [MAT],
    anim: {
      base: { ...SUPINE, L1: [298, 244], f1: 175 },
      frames: [
        { _h: 400, _d: 900 },
        { t: -101, n: -112, _h: 8000, _d: 900 },
      ],
    },
  },
  {
    id: 'side-plank', name: 'Side plank', pillar: 'stabilize', place: 'floor', equip: 'Mat',
    objective: 'Train the lateral core (obliques, quadratus lumborum) that resists side-bending and protects the spine.',
    muscles: ['Obliques', 'Quadratus lumborum', 'Glute medius'], focus: ['torso', 'hip'],
    cues: ['Elbow under shoulder, top hand on hip.', 'Lift the hips into a straight line, head to feet.', 'Breathe and hold — don\'t let the hips sag.', 'Too hard? Do it from the knees.'],
    avoid: ['Hips piking back', 'Shoulder shrugging to the ear'],
    safety: 'Part of the McGill "Big 3". Start with knees bent if needed.',
    dose: { reps: 3, sets: 2, sides: 2 },
    props: [MAT],
    anim: {
      base: { x: 175, y: 240, t: 116, c: 0, n: 116, A1: [264, 246], A2: { on: 'torso', s: 0.12, off: 10 }, L1: [84, 245], L2: [88, 241], f1: 90, f2: 90 },
      frames: [
        { _h: 300, _d: 1000 },
        { x: 172, y: 225, t: 103, n: 104, _h: 8000, _d: 1000 },
      ],
    },
  },
  {
    id: 'bird-dog', name: 'Bird dog', pillar: 'stabilize', place: 'floor', equip: 'Mat',
    objective: 'Teach the spine to stay still while the hips and shoulders move — the foundation of every functional pattern.',
    muscles: ['Glutes', 'Spinal erectors', 'Deep core', 'Shoulders'], focus: ['torso', 'arm1', 'leg2', 'hip'],
    cues: ['From all fours, brace like someone may poke your belly.', 'Reach one arm forward and the opposite leg back.', 'Hold 6–8 s; imagine a glass of water on your low back.', 'Return slowly and switch.'],
    avoid: ['Lifting the leg too high and arching', 'Rotating the hips'],
    safety: 'Part of the McGill "Big 3". Quality over height.',
    dose: { reps: 5, sets: 2, sides: 2 },
    props: [MAT],
    anim: {
      base: { ...QUAD, bA1: 1 },
      frames: [
        { _h: 300, _d: 1400 },
        { A1: [266, 172], L2: [52, 192], f2: -80, n: 96, _h: 6000, _d: 1400 },
      ],
    },
  },
  {
    id: 'dead-bug', name: 'Dead bug', pillar: 'stabilize', place: 'floor', equip: 'Mat',
    objective: 'Anti-extension core control: keep the low back quiet while arms and legs move.',
    muscles: ['Transverse abdominis', 'Rectus abdominis', 'Hip flexors'], focus: ['torso'],
    cues: ['On your back, arms to the ceiling, hips and knees at 90°.', 'Exhale and lower one arm overhead and the opposite leg out.', 'Keep the low back gently pressed toward the floor.', 'Return and alternate.'],
    avoid: ['Low back arching off the floor', 'Moving fast'],
    safety: 'Shorten the reach if your back arches.',
    dose: { reps: 6, sets: 2, sides: 2 },
    props: [MAT],
    anim: {
      base: { ...SUPINE, A1: [148, 176], A2: [144, 178], L1: [254, 197], L2: [252, 199], f1: 175, f2: 175 },
      frames: [
        { _h: 300, _d: 1500 },
        { A1: [86, 226], L2: [296, 228], f2: 160, _h: 800, _d: 1200 },
      ],
    },
  },
  {
    id: 'glute-bridge', name: 'Glute bridge', pillar: 'stabilize', place: 'floor', equip: 'Mat',
    objective: 'Wake up the glutes so they — not the low back — drive hip extension in walking, lifting and running.',
    muscles: ['Glute maximus', 'Hamstrings', 'Deep core'], focus: ['hip', 'thigh1', 'thigh2'],
    cues: ['Feet flat, hip-width, heels close to the glutes.', 'Brace lightly, then squeeze the glutes to lift.', 'Stop when knees, hips and shoulders line up.', 'Hold 2 s, lower with control.'],
    avoid: ['Over-arching the low back at the top', 'Pushing through the toes'],
    safety: 'If you feel it in the low back, lift less high and squeeze the glutes harder.',
    dose: { reps: 10, sets: 2, sides: 1 },
    props: [MAT],
    anim: {
      base: { ...SUPINE },
      frames: [
        { _h: 300, _d: 1200 },
        { x: 206, y: 208, t: -61, _h: 2000, _d: 1000 },
      ],
    },
  },
  {
    id: 'pallof-press', name: 'Pallof press', pillar: 'stabilize', place: 'gym', equip: 'Band or cable',
    objective: 'Anti-rotation strength: the core resists twisting so force transfers through a stable spine.',
    muscles: ['Obliques', 'Transverse abdominis', 'Glutes'], focus: ['torso'],
    cues: ['Stand side-on to the anchor, band at chest height.', 'Soft knees, ribs down, glutes on.', 'Press straight out and hold 2 s — don\'t let it pull you round.', 'Bring it back to the chest with control.'],
    avoid: ['Rotating toward the anchor', 'Leaning away'],
    safety: 'Pick a band you can control for every rep.',
    dose: { reps: 8, sets: 2, sides: 2 },
    props: [{ type: 'anchor', x: 40, y: 122 }, { type: 'band', from: [40, 122] }],
    anim: {
      base: { ...STAND, y: 160, L1: [186, 246], L2: [176, 246], A1: [202, 124], A2: [200, 126] },
      frames: [
        { _h: 200, _d: 1000 },
        { A1: [242, 118], A2: [240, 120], _h: 2000, _d: 1000 },
      ],
    },
  },

  // ======================= STRENGTHEN =======================
  {
    id: 'hip-hinge', name: 'Hip hinge (dowel)', pillar: 'strengthen', place: 'anywhere', equip: 'Broomstick (optional)',
    objective: 'Groove the most important pattern for back health: bend from the hips, not the spine.',
    muscles: ['Glutes', 'Hamstrings', 'Spinal erectors'], focus: ['hip', 'thigh1'],
    cues: ['Stick touches head, upper back and tailbone.', 'Soft knees, push the hips straight back.', 'Keep all three contact points as you lean forward.', 'Drive the hips forward to stand tall.'],
    avoid: ['Rounding the low back', 'Squatting down instead of hinging'],
    safety: 'Master this unloaded before adding deadlifts at the gym.',
    dose: { reps: 10, sets: 2, sides: 1 },
    props: [{ type: 'dowel' }],
    anim: {
      base: { ...STAND, A1: { on: 'torso', s: 1.02, off: 15 }, A2: { on: 'torso', s: 0.12, off: 15 }, bA1: 1 },
      frames: [
        { _h: 300, _d: 1300 },
        { x: 158, y: 163, t: 112, n: 112, _h: 500, _d: 1300 },
      ],
    },
  },
  {
    id: 'sit-to-stand', name: 'Sit-to-stand squat', pillar: 'strengthen', place: 'anywhere', equip: 'Chair',
    objective: 'A pain-safe squat pattern that builds leg strength for every chair, car seat and toilet in your life.',
    muscles: ['Quadriceps', 'Glutes', 'Adductors'], focus: ['hip', 'thigh1'],
    cues: ['Feet just in front of the chair, hip-width.', 'Reach the arms forward and sit back, chest proud.', 'Lightly touch the seat — don\'t flop.', 'Drive through the whole foot to stand.'],
    avoid: ['Knees caving inward', 'Rounding forward to get up'],
    safety: 'Use a higher seat if your back complains.',
    dose: { reps: 10, sets: 2, sides: 1 },
    props: [{ type: 'chair', x: 96, w: 64, seat: 203, back: 140 }],
    anim: {
      base: { ...STAND, x: 186, y: 157, L1: [198, 246], L2: [192, 246], a1: 12, e1: 20, a2: 8, e2: 16 },
      frames: [
        { _h: 300, _d: 1500 },
        { x: 150, y: 193, t: 146, n: 140, a1: 96, e1: 92, a2: 92, e2: 90, _h: 300, _d: 1500 },
      ],
    },
  },
  {
    id: 'split-squat', name: 'Split squat', pillar: 'strengthen', place: 'anywhere', equip: 'None (dumbbells at gym)',
    objective: 'Single-leg strength and hip stability — fixes the side-to-side imbalances that often feed back pain.',
    muscles: ['Quadriceps', 'Glutes', 'Hip flexors (stretch)'], focus: ['thigh1', 'hip'],
    cues: ['Long stride; back heel lifted.', 'Drop the back knee straight down toward the floor.', 'Torso tall, front foot flat.', 'Push through the front heel to rise.'],
    avoid: ['Front knee collapsing inward', 'Leaning far forward'],
    safety: 'Shorten the range if you feel it in the low back.',
    dose: { reps: 8, sets: 2, sides: 2 },
    anim: {
      base: { ...STAND, x: 176, y: 163, t: 178, n: 178, L1: [216, 246], L2: [128, 240], f2: 55 },
      frames: [
        { _h: 200, _d: 1400 },
        { x: 172, y: 196, _h: 300, _d: 1200 },
      ],
    },
  },
  {
    id: 'sl-rdl', name: 'Single-leg RDL', pillar: 'strengthen', place: 'anywhere', equip: 'None (kettlebell at gym)',
    objective: 'Hinge on one leg to build glute and hamstring strength plus the balance that protects the back on uneven ground.',
    muscles: ['Glute max & medius', 'Hamstrings', 'Foot & ankle'], focus: ['hip', 'thigh1'],
    cues: ['Stand on one leg, soft knee.', 'Hinge forward as the free leg reaches straight back.', 'Body moves like a seesaw — hips square to the floor.', 'Squeeze the standing glute to return.'],
    avoid: ['Opening the hip / twisting', 'Rounding the back to reach lower'],
    safety: 'Hold a wall or chair for balance at first.',
    dose: { reps: 6, sets: 2, sides: 2 },
    anim: {
      base: { ...STAND, L2: [170, 238], f2: 30, a1: 2, e1: 2, a2: -2, e2: -2 },
      frames: [
        { _h: 300, _d: 1400 },
        { x: 174, y: 162, t: 96, n: 100, L2: [86, 168], f2: 0, _h: 800, _d: 1400 },
      ],
    },
  },
  {
    id: 'suitcase-carry', name: 'Suitcase carry', pillar: 'strengthen', place: 'gym', equip: 'Kettlebell / dumbbell / heavy bag',
    objective: 'Carry a weight in one hand and walk tall — the lateral core resists bending, exactly like real life.',
    muscles: ['Quadratus lumborum', 'Obliques', 'Grip', 'Glute medius'], focus: ['torso', 'arm1'],
    cues: ['Weight in one hand, shoulders level.', 'Stand tall — don\'t lean away from the weight.', 'Walk slow and controlled.', 'Switch hands each set.'],
    avoid: ['Leaning toward the weight', 'Shrugging the shoulder'],
    safety: 'Start light. A full grocery bag works outside the gym.',
    dose: { secs: 30, sets: 2, sides: 2 },
    props: [{ type: 'kb' }],
    anim: {
      base: { x: 180, y: 160, t: 180, c: 0, n: 180, a1: 2, e1: 2, a2: 0, e2: 15, h1: 0, k1: 0, h2: 0, k2: 0, f1: 92, f2: 92 },
      frames: [
        { y: 160, h1: 22, k1: 12, h2: -18, k2: -30, f2: 70, a2: 20, e2: 38, _d: 300 },
        { y: 156, h1: -2, k1: -4, h2: 22, k2: -40, f2: 80, a2: 0, e2: 15, _d: 300 },
        { y: 160, h1: -18, k1: -30, h2: 22, k2: 12, f1: 70, f2: 92, a2: -20, e2: -5, _d: 300 },
        { y: 156, h1: 22, k1: -40, h2: -2, k2: -4, f1: 80, a2: 0, e2: 15, _d: 300 },
      ],
    },
  },
  {
    id: 'walk', name: 'Brisk walk', pillar: 'strengthen', place: 'anywhere', equip: 'None',
    objective: 'Walking is one of the best-evidenced treatments for low back pain — it pumps fluid through the discs and calms nerves.',
    muscles: ['Whole body', 'Glutes', 'Calves'], focus: ['leg1', 'leg2'],
    cues: ['Stand tall and let the arms swing naturally.', 'Walk at a pace where you can talk but not sing.', 'Short, quick steps if the back is sore.', 'Breathe through the nose.'],
    avoid: ['Phone-staring with the head forward'],
    safety: 'Several short walks beat one long one on painful days.',
    dose: { secs: 120, sets: 1, sides: 1 },
    anim: {
      base: { x: 180, y: 160, t: 178, c: 0, n: 178, a1: 0, e1: 15, a2: 0, e2: 15, h1: 0, k1: 0, h2: 0, k2: 0, f1: 92, f2: 92 },
      frames: [
        { y: 160, h1: 22, k1: 12, h2: -18, k2: -30, f2: 70, f1: 92, a1: -20, e1: -5, a2: 22, e2: 40, _d: 300 },
        { y: 156, h1: -2, k1: -4, h2: 22, k2: -40, f2: 80, a1: 0, e1: 15, a2: 0, e2: 15, _d: 300 },
        { y: 160, h1: -18, k1: -30, h2: 22, k2: 12, f1: 70, f2: 92, a1: 22, e1: 40, a2: -20, e2: -5, _d: 300 },
        { y: 156, h1: 22, k1: -40, h2: -2, k2: -4, f1: 80, a1: 0, e1: 15, a2: 0, e2: 15, _d: 300 },
      ],
    },
  },

  // ======================= MOBILISE =======================
  {
    id: 'hip-flexor-stretch', name: 'Half-kneeling hip flexor stretch', pillar: 'mobilize', place: 'floor', equip: 'Mat / cushion',
    objective: 'Open the front of the hip. Tight hip flexors from sitting pull the pelvis forward and load the low back.',
    muscles: ['Hip flexors (psoas, rectus femoris)', 'Glutes'], focus: ['thigh1', 'hip'],
    cues: ['Back knee down on a cushion, front foot flat.', 'Tuck the tailbone and squeeze the back glute.', 'Shift forward a little and reach the arm up.', 'Feel the stretch at the front of the back hip.'],
    avoid: ['Arching the low back to "fake" the stretch', 'Big forward lunge'],
    safety: 'The glute squeeze is what makes it work — small movement, big squeeze.',
    dose: { reps: 5, sets: 1, sides: 2 },
    props: [MAT],
    anim: {
      base: { x: 158, y: 200, t: 180, c: 0, n: 180, L1: [108, 244], L2: [206, 246], f1: -90, f2: 90, a1: 8, e1: 20, a2: 4, e2: 10 },
      frames: [
        { _h: 300, _d: 1500 },
        { x: 167, y: 202, t: 183, c: 0.15, n: 183, a1: 172, e1: 172, _h: 4000, _d: 1500 },
      ],
    },
  },
  {
    id: 'rock-back', name: 'Quadruped rock-back', pillar: 'mobilize', place: 'floor', equip: 'Mat',
    objective: 'Restore hip flexion while the spine stays neutral — teaches the hips, not the back, to bend.',
    muscles: ['Hips', 'Glutes', 'Lats'], focus: ['hip'],
    cues: ['From all fours with hands slightly forward.', 'Keep a neutral back and rock the hips toward the heels.', 'Stop before the low back starts to round.', 'Rock forward to the start.'],
    avoid: ['Rounding the low back at the end', 'Dropping the head'],
    safety: 'Small range is fine — the spine must stay still.',
    dose: { reps: 8, sets: 1, sides: 1 },
    props: [MAT],
    anim: {
      base: { ...QUAD, A1: [214, 246], A2: [210, 246], bA1: 1, bA2: 1 },
      frames: [
        { _h: 300, _d: 1500 },
        { x: 104, y: 218, t: 105, n: 105, _h: 1500, _d: 1500 },
      ],
    },
  },
  {
    id: 'open-book', name: 'Quadruped T-spine rotation', pillar: 'mobilize', place: 'floor', equip: 'Mat',
    objective: 'Get rotation from the upper back so the lower back doesn\'t have to twist.',
    muscles: ['Thoracic spine', 'Rotator cuff', 'Obliques'], focus: ['torso', 'arm1'],
    cues: ['On all fours, one hand behind your head.', 'Rotate the elbow down toward the opposite arm.', 'Then rotate open, elbow to the ceiling — follow with your eyes.', 'Hips stay still.'],
    avoid: ['Shifting the hips', 'Rushing the rotation'],
    safety: 'Move within a comfortable range.',
    dose: { reps: 6, sets: 1, sides: 2 },
    props: [MAT],
    anim: {
      base: { ...QUAD, A1: null, a1: -10, e1: 140 },
      frames: [
        { a1: -8, e1: 140, n: 95, _h: 300, _d: 1300 },
        { a1: 170, e1: 45, n: 150, _h: 1000, _d: 1300 },
      ],
    },
  },
  {
    id: 'seated-t-ext', name: 'Seated thoracic extension', pillar: 'mobilize', place: 'anywhere', equip: 'Chair',
    objective: 'Undo desk posture: extend the upper back over the chair so the lower back doesn\'t over-arch to compensate.',
    muscles: ['Thoracic spine', 'Chest', 'Upper back'], focus: ['torso'],
    cues: ['Sit back so the chair top hits your mid-back.', 'Hands behind your head, elbows forward.', 'Breathe out and arch the upper back over the chair.', 'Return to tall sitting.'],
    avoid: ['Pulling on the neck', 'Arching from the low back'],
    safety: 'Great every hour at the desk.',
    dose: { reps: 8, sets: 1, sides: 1 },
    props: [{ type: 'chair', x: 124, w: 76, seat: 210, back: 168 }],
    anim: {
      base: { ...SEATED, x: 142, L1: [194, 246], L2: [189, 246], A1: { on: 'torso', s: 1.22, off: 13 }, A2: { on: 'torso', s: 1.22, off: 11 } },
      frames: [
        { _h: 300, _d: 1200 },
        { t: 197, c: -0.6, n: 208, _h: 2000, _d: 1200 },
      ],
    },
  },
  {
    id: 'deep-squat', name: 'Supported deep squat', pillar: 'mobilize', place: 'anywhere', equip: 'Door frame / pole',
    objective: 'Restore the resting squat: hips, ankles and adductors move freely, taking strain away from the back.',
    muscles: ['Hips', 'Adductors', 'Ankles'], focus: ['hip', 'thigh1'],
    cues: ['Hold a door frame or pole at arm\'s length.', 'Sit straight down between your heels.', 'Chest up, breathe slowly at the bottom.', 'Use the arms to help you stand.'],
    avoid: ['Heels lifting', 'Bouncing at the bottom'],
    safety: 'Only go as low as is comfortable for your back.',
    dose: { reps: 4, sets: 1, sides: 1 },
    props: [{ type: 'post', x: 246 }],
    anim: {
      base: { ...STAND, L1: [190, 246], L2: [186, 246], A1: [238, 124], A2: [236, 128] },
      frames: [
        { _h: 300, _d: 1600 },
        { x: 160, y: 224, t: 160, n: 160, A1: [238, 176], A2: [236, 180], _h: 5000, _d: 1600 },
      ],
    },
  },
  {
    id: 'ankle-rock', name: 'Knee-to-wall ankle rocks', pillar: 'mobilize', place: 'anywhere', equip: 'Wall',
    objective: 'Ankle mobility lets the hips and back move properly in squats, lunges and walking.',
    muscles: ['Calves', 'Achilles', 'Ankle joint'], focus: ['shin1'],
    cues: ['Hands on the wall, one foot forward.', 'Drive the front knee forward over the toes.', 'Keep the heel glued down.', 'Rock back and repeat.'],
    avoid: ['Heel lifting', 'Knee collapsing inward'],
    safety: 'Gentle calf stretch on the back leg too.',
    dose: { reps: 10, sets: 1, sides: 2 },
    props: [{ type: 'wall', x: 270 }],
    anim: {
      base: { ...STAND, x: 182, y: 158, t: 172, n: 172, L1: [226, 246], L2: [132, 246], A1: [266, 114], A2: [266, 120] },
      frames: [
        { _h: 200, _d: 1000 },
        { x: 198, y: 174, _h: 800, _d: 1000 },
      ],
    },
  },
];

export const BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

// ---------- video guides ----------
// Curated YouTube search queries (robust: no hard-coded IDs that can disappear).
const YT_QUERY = {
  'nerve-floss-seated': 'seated sciatic nerve flossing slider physiotherapist',
  'nerve-glide-supine': 'supine sciatic nerve glide physiotherapy',
  'prone-press-up': 'McKenzie prone press up lumbar extension physiotherapist',
  'standing-extension': 'McKenzie standing back extension exercise',
  'cat-camel': 'McGill cat camel exercise',
  'breathing-9090': '90 90 breathing hip lift PRI diaphragmatic',
  'curl-up': 'McGill curl up proper form Stuart McGill',
  'side-plank': 'McGill side plank progression back pain',
  'bird-dog': 'McGill bird dog proper form',
  'dead-bug': 'dead bug exercise proper form physiotherapist',
  'glute-bridge': 'glute bridge proper form low back pain',
  'pallof-press': 'pallof press proper form anti rotation',
  'hip-hinge': 'hip hinge dowel drill tutorial',
  'sit-to-stand': 'sit to stand box squat proper form',
  'split-squat': 'split squat proper form tutorial',
  'sl-rdl': 'single leg romanian deadlift bodyweight tutorial',
  'suitcase-carry': 'suitcase carry proper form core',
  'walk': 'walking for low back pain physiotherapist',
  'hip-flexor-stretch': 'half kneeling hip flexor stretch glute squeeze',
  'rock-back': 'quadruped rock back exercise neutral spine',
  'open-book': 'quadruped thoracic rotation hand behind head',
  'seated-t-ext': 'seated thoracic extension over chair',
  'deep-squat': 'assisted deep squat hold mobility door frame',
  'ankle-rock': 'knee to wall ankle dorsiflexion mobility',
};

export function ytSearchUrl(ex) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(YT_QUERY[ex.id] || ex.name + ' exercise')}`;
}
export const ytWatchUrl = id => `https://www.youtube.com/watch?v=${id}`;
export const ytEmbedUrl = id => `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=0`;

/** Accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID or a bare 11-char ID. */
export function parseYouTubeId(input) {
  const s = String(input || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    if (!/(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|^youtu\.be$/.test(u.hostname)) return null;
    const id = u.hostname === 'youtu.be' ? u.pathname.slice(1)
      : u.searchParams.get('v') || (u.pathname.match(/\/(shorts|embed|live|v)\/([\w-]{11})/) || [])[2];
    return id && /^[\w-]{11}$/.test(id.slice(0, 11)) ? id.slice(0, 11) : null;
  } catch { return null; }
}
