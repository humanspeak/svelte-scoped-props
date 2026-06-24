<script lang="ts">
    import type { Snippet } from 'svelte'

    type Status = 'passed' | 'blocked'

    type Props = {
        status: Status
        title: string
        description: string
        children: Snippet
    }

    let { status, title, description, children }: Props = $props()
    let isPassing = $derived(status === 'passed')
</script>

<article class={['case', status]}>
    <div class="case-heading">
        <span
            class={['status-icon', isPassing ? 'pass' : 'fail']}
            aria-label={isPassing ? 'passing' : 'failing'}
        >
            {isPassing ? '✓' : '×'}
        </span>
        <div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    </div>

    {@render children()}
</article>
