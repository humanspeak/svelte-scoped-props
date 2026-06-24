<script lang="ts">
    import ClassValueAliasCase from './lib/cases/ClassValueAliasCase.svelte'
    import ClientLiteralCase from './lib/cases/ClientLiteralCase.svelte'
    import DynamicClassValueCase from './lib/cases/DynamicClassValueCase.svelte'
    import NonClassValueClassPropCase from './lib/cases/NonClassValueClassPropCase.svelte'
    import ParentOnlyClassCase from './lib/cases/ParentOnlyClassCase.svelte'
    import SpreadPropsCase from './lib/cases/SpreadPropsCase.svelte'
    import SsrLiteralCase from './lib/cases/SsrLiteralCase.svelte'
</script>

<main>
    <header>
        <p class="eyebrow">Svelte class styling repro</p>
        <h1>Parent classes on native elements vs components</h1>
    </header>

    <section class="case-board">
        <h2>Patch checklist</h2>

        <div class="case-list">
            <ClientLiteralCase />
            <ParentOnlyClassCase />
            <SsrLiteralCase />
            <DynamicClassValueCase />
            <NonClassValueClassPropCase />
            <ClassValueAliasCase />
            <SpreadPropsCase />
        </div>
    </section>
</main>
