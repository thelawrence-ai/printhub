# PrintHub Design Direction

## Three stylistic approaches

### Theme Name: Paper Street Studio
Very Brief Intro: A warm editorial print-shop identity with cream paper, ink black, and a vivid coral registration mark. It feels tactile, practical, and made for busy students.
Probability: 0.07

### Theme Name: Campus Utility
Very Brief Intro: A crisp wayfinding system inspired by campus signage, with cobalt blue, safety yellow, and modular information cards. It prioritizes speed and clarity.
Probability: 0.04

### Theme Name: Quiet Copy Desk
Very Brief Intro: A calm library-adjacent interface using slate, sage, and soft paper tones. It makes study materials feel organized, dependable, and low-friction.
Probability: 0.02

## Chosen approach: Paper Street Studio

### Design Movement
Contemporary editorial design with Swiss International Typographic influence, softened by the tactile character of a neighborhood print shop.

### Core Principles
1. Make the next action obvious: every section should help a student submit, choose, or collect faster.
2. Use paper-like surfaces and ink-like contrast to create trust without looking corporate.
3. Let typography do the organizing: strong editorial hierarchy, short lines, and visible labels.
4. Favor intentional asymmetry over a generic centered marketing grid.

### Color Philosophy
The base is warm uncoated-paper cream, which lowers visual noise and makes the interface feel physical. Ink-black provides authority and legibility. The signature color is print-coral: energetic enough to stand out in a campus rush, but warm enough to feel human. A muted sage supports delivery and process states without competing with the primary action.

### Layout Paradigm
A split editorial composition: a left rail for brand and context, a wide working canvas for ordering and delivery information, and staggered cards that resemble a sheet stack rather than a symmetrical dashboard.

### Signature Elements
- A coral registration-cross motif used as a subtle section marker and logo detail.
- Layered paper cards with offset shadow edges, as if freshly trimmed and stacked.
- Small uppercase production labels such as READY IN 2 HOURS and FILE CHECK.

### Interaction Philosophy
Interactions should feel like handling paper: decisive buttons, gentle lift on hover, and clear confirmation states. Avoid mystery; show the student what happens next, when it happens, and where it can be collected.

### Animation
Use quick 180–240ms ease-out transitions for buttons, cards, and navigation. Stagger the hero metrics and order steps by 50ms. On hover, cards lift 4px and reveal a coral edge. Respect prefers-reduced-motion and never animate layout dimensions.

### Typography System
Display: Fraunces, with large editorial headlines in 600 weight and occasional italic emphasis. Body/UI: DM Sans, 400–700 for compact labels, form controls, and supporting copy. Use uppercase tracked labels at 11–12px for operational metadata. Headlines should use tight leading and short line lengths.

### Brand Essence
PrintHub is the fast, student-first copy desk for getting notes from file to hand without the queue. Personality: direct, warm, capable.

### Brand Voice
Headlines are confident and specific. CTAs sound like useful actions, not sales slogans. Microcopy answers the question a student is about to ask.

Example lines:
- "Your notes, ready before the next lecture."
- "Upload once. We handle the stack."

### Wordmark & Logo
A compact wordmark paired with a bold coral registration-cross symbol. The symbol is made from four offset crop marks around a solid center dot, suggesting precision, alignment, and print production.

### Signature Brand Color
Print Coral — #E9604C. Ownable, warm, and visible against the cream paper field.
