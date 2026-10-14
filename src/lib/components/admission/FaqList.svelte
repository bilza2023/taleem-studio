<!-- src/lib/components/admission/FaqUrdu.svelte -->
<script>
	const faqs = [
		{
			q: "کیا پہلے Taleem.help پر اکاؤنٹ بنانا ضروری ہے؟",
			a: "جی ہاں۔ فیس بھیجنے سے پہلے Taleem.help پر اپنا اکاؤنٹ بنا لیں، اور رسید بھیجتے وقت اسی اکاؤنٹ کا ای میل لکھ دیں۔ اس طرح ہمیں معلوم ہوتا ہے کہ کورس کس اکاؤنٹ پر کھولنا ہے۔"
		},
		{
			q: "فیس کیسے ادا کریں؟",
			a: "اس صفحے کے اوپر دیے گئے Easypaisa نمبر پر فیس بھیجیں۔ پھر اپنی جماعت کے کارڈ پر بٹن دبا کر WhatsApp پر رسید کا سکرین شاٹ بھیج دیں۔ بس یہی دو مراحل ہیں۔"
		},
		{
			q: "اگر میرے پاس Easypaisa نہیں ہے تو؟",
			a: "کوئی مسئلہ نہیں۔ JazzCash یا کسی بھی بینک ایپ سے اسی Easypaisa نمبر پر رقم بھیجی جا سکتی ہے۔ رسید کا سکرین شاٹ ویسے ہی WhatsApp پر بھیج دیں۔"
		},
		{
			q: "رسید بھیجنے کے بعد کورس کب کھلے گا؟",
			// TODO: confirm the time you can actually promise
			a: "رسید ملنے کے بعد عموماً 24 گھنٹوں کے اندر کورس آپ کے Taleem.help اکاؤنٹ پر کھول دیا جاتا ہے، اور WhatsApp پر آپ کو اطلاع بھی دے دی جاتی ہے۔"
		},
		{
			q: "کیا ماہانہ فیس کا آپشن ہے؟",
			a: "نہیں۔ ہر کورس پورے ایک سال کے لیے ہے، تاکہ اس جماعت کے ہر ٹیسٹ اور امتحان میں آپ اسے استعمال کر سکیں۔ ایک بار فیس، پورا سال رسائی۔"
		},
		{
			q: "ایک سال بعد کیا ہوگا؟",
			a: "سال مکمل ہونے پر آپ بہت معمولی فیس میں کورس مزید ایک سال کے لیے بڑھا سکتے ہیں۔"
		},
		{
			q: "کیا نئے اسباق اور اپ ڈیٹس فیس میں شامل ہیں؟",
			a: "جی ہاں۔ اسباق باقاعدگی سے بہتر کیے جاتے ہیں: وضاحت، خاکے اور آواز سب۔ یہ تمام بہتریاں اور نئے اسباق آپ کی فیس میں شامل ہیں، کوئی اضافی رقم نہیں۔"
		},
		{
			q: "کیا ایک اکاؤنٹ دو طالب علم استعمال کر سکتے ہیں؟",
			a: "نہیں۔ ایک اکاؤنٹ ایک طالب علم کے لیے ہے۔ ہر طالب علم کے سوالات اور پیش رفت اس کے اپنے اکاؤنٹ سے جڑے ہوتے ہیں۔"
		},
		{
			q: "کیمپس کلاسز میں کیا شامل ہے؟",
			a: "ابتدائی بیچز کے لیے بحریہ ٹاؤن فیز 8 کیمپس پر دو ماہ کی کلاسز، آن لائن کورس کے ساتھ۔ کیمپس پر سیٹیں محدود ہیں، اس لیے کیمپس کے لیے فیس بھیجنے سے پہلے WhatsApp پر سیٹ کی تصدیق کر لیں۔"
		},
		{
			q: "اگر غلط جماعت کی فیس بھیج دی ہو تو؟",
			// TODO: confirm the policy
			a: "7 دن کے اندر WhatsApp پر بتا دیں، ہم آپ کا کورس درست جماعت میں تبدیل کر دیں گے۔"
		}
	];
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@500;700&display=swap"
	/>
</svelte:head>

<section class="faq" dir="rtl" lang="ur">
	<h2>داخلے کے بارے میں سوالات</h2>

	{#each faqs as item}
		<details>
			<summary>{item.q}</summary>
			<p>{item.a}</p>
		</details>
	{/each}
</section>

<style>
	.faq {
		font-family: "Noto Nastaliq Urdu", serif;
		text-align: right;
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1.7rem;
		font-weight: 700;
		line-height: 2.2;
	}

	details {
		margin: 0;
		border-bottom: 1px solid var(--theme-border);
		padding: 0.25rem 0;
	}

	summary {
		padding: 0.6rem 0;
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 2.2;
		cursor: pointer;
		color: var(--theme-text);
	}

	summary:hover,
	details[open] summary {
		color: var(--theme-accent);
	}

	p {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		font-weight: 500;
		line-height: 2.3;
	}
</style>