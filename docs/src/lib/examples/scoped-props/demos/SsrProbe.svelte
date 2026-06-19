<script lang="ts">
    import ChildCard from './components/ChildCard.svelte'
</script>

<section class="ssr-probe">
    <div class="demo-card parent-owned">SSR native element</div>
    <ChildCard scoped:class="parent-owned" />
    <ChildCard class="dimmed" />
</section>

<style>
    .ssr-probe {
        display: grid;
        gap: 10px;
    }

    .demo-card {
        min-height: 80px;
        display: grid;
        place-items: center;
        padding: 14px;
        border: 2px dashed var(--proof-card-border, gray);
        border-radius: 6px;
        color: var(--proof-card-ink, black);
        text-align: center;
        background: var(--proof-card-bg, white);
    }

    .parent-owned {
        border-color: var(--proof-parent-border, purple);
        color: var(--proof-parent-ink, purple);
        background: var(--proof-parent-bg, pink);
    }

    .dimmed {
        opacity: 0.35;
    }
</style>
