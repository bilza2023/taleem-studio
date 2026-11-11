<script>
    import emblaCarouselSvelte from "embla-carousel-svelte";
    import Autoplay from "embla-carousel-autoplay";

    // slides: [{ src, alt, href? }]
    let { slides = [], interval = 6000, aspect = "16 / 7" } = $props();

    let embla = $state(null);
    let selected = $state(0);

    const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const options = { loop: true, align: "center", duration: 32 };
    const plugins = reduceMotion
        ? []
        : [Autoplay({ delay: interval, stopOnInteraction: false, stopOnMouseEnter: true })];

    function onInit(event) {
        embla = event.detail;
        const update = () => (selected = embla.selectedScrollSnap());
        embla.on("select", update).on("reInit", update);
        update();
    }

    function go(action) {
        action();
        embla?.plugins()?.autoplay?.reset();
    }
    const prev = () => go(() => embla?.scrollPrev());
    const next = () => go(() => embla?.scrollNext());
    const goTo = (i) => go(() => embla?.scrollTo(i));
</script>

<section class="hero-carousel" aria-roledescription="carousel">
    <div class="viewport" use:emblaCarouselSvelte={{ options, plugins }} onemblaInit={onInit}>
        <div class="track">
            {#each slides as slide, i}
                <div
                    class="slide"
                    class:is-selected={i === selected}
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${slides.length}`}
                >
                    <svelte:element
                        this={slide.href ? "a" : "div"}
                        href={slide.href}
                        class="frame"
                        style:aspect-ratio={aspect}
                    >
                        <img
                            src={slide.src}
                            alt={slide.alt ?? ""}
                            loading={i === 0 ? "eager" : "lazy"}
                            draggable="false"
                        />
                    </svelte:element>
                </div>
            {/each}
        </div>
    </div>

    {#if slides.length > 1}
        <button class="arrow left" onclick={prev} aria-label="Previous slide">‹</button>
        <button class="arrow right" onclick={next} aria-label="Next slide">›</button>

        <div class="dots">
            {#each slides as _, i}
                <button
                    class="dot"
                    class:active={i === selected}
                    onclick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                ></button>
            {/each}
        </div>
    {/if}
</section>

<style>
    /* .hero-carousel {
        --accent: #f5b82e;
        position: relative;
        padding: 2rem 0 1rem;
    } */
    .hero-carousel {
    --accent: #f5b82e;
    position: relative;
    padding: 2rem 0 1rem;
    max-width: 1400px;   /* add */
    margin: 0 auto;      /* add */
}

    .viewport {
        overflow: hidden;
    }

    .track {
        display: flex;
        touch-action: pan-y pinch-zoom;
        margin-left: -1rem; /* cancels first slide gap */
    }

    .slide {
        flex: 0 0 86%;
        min-width: 0;
        padding-left: 1rem;
        opacity: 0.35;
        transform: scale(0.94);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .slide.is-selected {
        opacity: 1;
        transform: scale(1);
    }

    .frame {
        display: block;
        width: 100%;
        border-radius: 22px;
        overflow: hidden;
        background: #0b1530;
        border: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
        box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04),
            0 20px 50px rgba(0, 0, 0, 0.45),
            0 0 40px color-mix(in srgb, var(--accent) 15%, transparent);
    }
    .frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        user-select: none;
    }

    .arrow {
        position: absolute;
        top: calc(50% - 1rem);
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(10, 20, 45, 0.55);
        backdrop-filter: blur(8px);
        color: #fff;
        font-size: 1.8rem;
        line-height: 1;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s, transform 0.2s;
    }
    .arrow:hover {
        background: rgba(10, 20, 45, 0.85);
        border-color: var(--accent);
        transform: translateY(-50%) scale(1.06);
    }
    .arrow.left  { left: 3%; }
    .arrow.right { right: 3%; }

    .dots {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.25rem;
    }
    .dot {
        width: 10px;
        height: 10px;
        padding: 0;
        border: none;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.25);
        cursor: pointer;
        transition: width 0.3s ease, background 0.3s ease;
    }
    .dot.active {
        width: 28px;
        background: var(--accent);
    }

    @media (max-width: 640px) {
        .hero-carousel { padding-top: 1rem; }
        .slide { flex-basis: 92%; padding-left: 0.6rem; }
        .track { margin-left: -0.6rem; }
        .frame { border-radius: 14px; }
        .arrow { display: none; } /* swipe on phones */
    }
</style>