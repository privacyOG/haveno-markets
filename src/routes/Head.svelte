<script>
let { title, description } = $props();
</script>

<title>{title}</title>
<meta name="description" content={description} />
<meta property="og:title" content={title} />
<meta name="og:description" content={description} />
<meta property="og:type" content="website" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
