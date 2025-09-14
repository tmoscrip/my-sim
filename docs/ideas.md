## Ideas

- Resources replenish over time
  - How to relate entity radius to fraction of resource remaining?
  - Consider available resource amount when selecting a resource target to seek
- Particle system using secondary webgl2 canvas
- Side panel to show details of selected entity
- Sprite rendering
- Creature lifecycles
  - Birth, growth, aging, death
  - Attributes influenced by age (e.g. young is slow, middle-aged is fast, old is slow)
  - Needs and desires weighted by age (e.g. young explores, old seeks safety)
- Creature memory and perception
- Components register their own debug rendering
- Use heading to derive correct x/y flips to prevent entities appearing upside down
- Refactor "passive resource providers"
  - Entities should choose to interact with resources, not have them forced on them
