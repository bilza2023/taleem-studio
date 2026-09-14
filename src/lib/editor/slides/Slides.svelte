
<script>
///home/bilal-tariq/00--TALEEM/taleem/src/lib/editor/slides/Slides.svelte
  import TitleAndSubtitle from "./templates/TitleAndSubtitle.svelte";
  import TitleAndParaEditor from "./templates/TitleAndParaEditor.svelte";
  import BulletListEditor from "./templates/BulletListEditor.svelte";
  import TwoColumnTextEditor from "./templates/TwoColumnTextEditor.svelte";
  import ImageSlideEditor from "./templates/ImageSlideEditor.svelte";
  import FillImageEditor from "./templates/FillImageEditor.svelte";
  import ImageWithTitleEditor from "./templates/ImageWithTitleEditor.svelte";
  import ImageWithCaptionEditor from "./templates/ImageWithCaptionEditor.svelte";
  import ImageLeftBulletsRightEditor from "./templates/ImageLeftBulletsRightEditor.svelte";
  import ImageRightBulletsLeftEditor from "./templates/ImageRightBulletsLeftEditor.svelte";
  import TableEditor from "./templates/TableEditor.svelte";
  import BarChartEditor from "./templates/BarChartEditor.svelte";
  import ProgressbarEditor from "./templates/ProgressbarEditor.svelte";
  import QuoteEditor from "./templates/QuoteEditor.svelte";
  import KeyIdeasEditor from "./templates/KeyIdeasEditor.svelte";
  import EqEditor from "./templates/EqEditor.svelte";

  import SlideHeader from "./components/SlideHeader.svelte";
  export let deck;

  $: slides = deck?.deck || [];
  export let runningTime;
 export let collapsed = {};

export let currentSlideIndex;

$: if (slides.length && (currentSlideIndex === undefined || currentSlideIndex === null || currentSlideIndex > slides.length - 1)) {
  currentSlideIndex = slides.length - 1;
}

function selectSlide(i) {
  currentSlideIndex = i;
}

  function setStart(i) {

	deck.deck[i].start = runningTime;

	if (i > 0) {

		deck.deck[i - 1].end = runningTime;

	}

	deck.deck = [...deck.deck];

}
function startChanged(i, value) {
  deck.deck[i].start = Number(value);

  if (i > 0) {
    deck.deck[i - 1].end = Number(value);
  }

  deck.deck = [...deck.deck];
}
  function toggleSlide(i) {

    collapsed[i] = !collapsed[i];
    collapsed = { ...collapsed };

  }

  function moveUp(i) {

    if (i === 0) return;

    const arr = deck.deck;

    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];

    deck.deck = [...arr];

    if (currentSlideIndex === i) currentSlideIndex = i - 1;
    else if (currentSlideIndex === i - 1) currentSlideIndex = i;

  }

   function moveDown(i) {

    const arr = deck.deck;

    if (i === arr.length - 1) return;

    [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];

    deck.deck = [...arr];

    if (currentSlideIndex === i) currentSlideIndex = i + 1;
    else if (currentSlideIndex === i + 1) currentSlideIndex = i;

  }

  function deleteSlide(i) {

    const arr = deck.deck;

    arr.splice(i, 1);

    deck.deck = [...arr];

    const map = {};

    arr.forEach((_, idx) => {

      map[idx] = collapsed[idx] || false;

    });

    collapsed = map;

    if (currentSlideIndex > i) currentSlideIndex -= 1;
    currentSlideIndex = Math.min(currentSlideIndex, Math.max(arr.length - 1, 0));

  }
const idMap = new WeakMap();
let idCounter = 0;

function getSlideId(slide) {
  if (!idMap.has(slide)) {
    idMap.set(slide, `slide-${idCounter++}`);
  }
  return idMap.get(slide);
}
  
</script>



  {#if slides.length === 0}
    <p class="empty">No slides</p>
  {/if}

  {#each slides as slide, i (getSlideId(slide))}

    <div
      class="slide"
      class:selected={i === currentSlideIndex}
      on:click|capture={() => selectSlide(i)}
    >

      <!-- Header -->

<SlideHeader

	slide={slide}
	index={i}
	collapsed={collapsed[i]}

	isLast={i === slides.length - 1}

	onToggle={() => toggleSlide(i)}
	onMoveUp={() => moveUp(i)}
	onMoveDown={() => moveDown(i)}
	onDelete={() => deleteSlide(i)}

	onSetStart={() => setStart(i)}
  onStartChange={(value) => startChanged(i, value)}
	onSetEnd={() => slide.end = runningTime}

/>

      <!-- Body -->

      {#if !collapsed[i]}

        <div class="slide-body">
          {#if slide.type === "titleAndSubtitle"}

            <TitleAndSubtitle {slide} {runningTime} />

          {:else if slide.type === "titleAndPara"}

            <TitleAndParaEditor {slide} {runningTime} />

          {:else if slide.type === "bulletList"}

            <BulletListEditor {slide} {runningTime} />

          {:else if slide.type === "twoColumnText"}

            <TwoColumnTextEditor {slide} {runningTime} />

          {:else if slide.type === "imageSlide"}

            <ImageSlideEditor {slide} {runningTime} />

          {:else if slide.type === "fillImage"}

            <FillImageEditor {slide} {runningTime} />

          {:else if slide.type === "imageWithTitle"}

            <ImageWithTitleEditor {slide} {runningTime} />

          {:else if slide.type === "imageWithCaption"}

            <ImageWithCaptionEditor {slide} {runningTime} />

          {:else if slide.type === "imageLeftBulletsRight"}

            <ImageLeftBulletsRightEditor {slide} {runningTime} />

          {:else if slide.type === "imageRightBulletsLeft"}

            <ImageRightBulletsLeftEditor {slide} {runningTime} />

          {:else if slide.type === "table"}

            <TableEditor {slide} {runningTime} />

          {:else if slide.type === "barChart"}

            <BarChartEditor {slide} {runningTime} />

          {:else if slide.type === "progressbar"}

            <ProgressbarEditor {slide} {runningTime} />

          {:else if slide.type === "quoteSlide"}

            <QuoteEditor {slide} {runningTime} />

          {:else if slide.type === "keyIdeasSlide"}

            <KeyIdeasEditor {slide} {runningTime} />

          {:else if slide.type === "eq"}

            <EqEditor {slide} {runningTime} />

          {:else}

            <div class="fallback">
              Editor not implemented yet: {slide.type}
            </div>

          {/if}


        </div>

      {/if}

    </div>

  {/each}

<style>

	.empty {
		color: var(--theme-text);
		opacity: 0.5;
	}

	.slide {
		border: 1px solid var(--theme-border);
		margin-bottom: 14px;
		border-radius: 8px;
		overflow: hidden;
		background: color-mix(in srgb, var(--theme-panel) 85%, black);
	}

	.slide-body {
		padding: 12px;
	}

	.fallback {
		color: var(--theme-text);
		opacity: 0.5;
		font-size: 13px;
	}
  	.slide.selected {
		border-color: #ef4444;
		border-width: 2px;
	}
</style>