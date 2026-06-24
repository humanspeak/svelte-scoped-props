<script lang="ts">
    import ChildCard from '../components/ChildCard.svelte'
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
        border: 2px dashed gray;
        border-radius: 6px;
        color: black;
        background: white;
    }

    .parent-owned {
        border-color: purple;
        color: purple;
        background: pink;
    }

    .dimmed {
        opacity: 0.35;
    }
</style>
