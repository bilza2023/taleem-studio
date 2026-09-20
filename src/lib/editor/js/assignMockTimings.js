// src/utils/assignMockTimings.js

import { SlideType } from "$lib/taleem-specs/enums/SlideType.js";

const EQ_LINE_INTERVAL = 3; // seconds between each eq line's showAt

/**
 * Compile a golden / browser-ready deck into a player-ready deck
 * by assigning mock absolute timings.
 *
 * @param {object} goldenDeck - deck object with a `deck` array
 * @param {number} slideDuration - seconds per non-eq slide (default: 5)
 * @returns {object} player-ready deck
 */
export function assignMockTimings(goldenDeck, slideDuration = 5) {
  if (
    !goldenDeck ||
    !Array.isArray(goldenDeck.deck) ||
    typeof slideDuration !== "number"
  ) {
    throw new Error("assignMockTimings: invalid deck or slideDuration");
  }

  let currentTime = 0;

  const deckWithTimings = {
    ...goldenDeck,
    deck: goldenDeck.deck.map(slide => {
      const start = currentTime;

      if (slide.type === SlideType.Eq && Array.isArray(slide.data)) {
        const numLines = slide.data.length;
        const end = start + EQ_LINE_INTERVAL * numLines;

        const data = slide.data.map((item, index) => ({
          ...item,
          showAt: start + EQ_LINE_INTERVAL * index
        }));

        currentTime = end;

        return {
          ...slide,
          start,
          end,
          data
        };
      }

      const end = start + slideDuration;
      currentTime = end;

      const data = Array.isArray(slide.data)
        ? slide.data.map(item => ({
            ...item,
            showAt: 0
          }))
        : slide.data;

      return {
        ...slide,
        start,
        end,
        data
      };
    })
  };

  return deckWithTimings;
}