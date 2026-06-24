import { demoCodeSample, type DemoCodeLoaderKey, type DemoCodeSample } from '$lib/demo-loaders'

const demoCodeDependencies: Partial<Record<DemoCodeLoaderKey, DemoCodeLoaderKey[]>> = {
    'scoped-props/demos/ClassValueAlias.svelte': [
        'scoped-props/demos/components/InternalClassCard.svelte'
    ],
    'scoped-props/demos/DynamicClassValue.svelte': [
        'scoped-props/demos/components/ChildCard.svelte'
    ],
    'scoped-props/demos/ExplicitLiteral.svelte': ['scoped-props/demos/components/ChildCard.svelte'],
    'scoped-props/demos/NonClassValueClassProp.svelte': [
        'scoped-props/demos/components/NonClassValueClassCard.svelte'
    ],
    'scoped-props/demos/PlainClassBoundary.svelte': [
        'scoped-props/demos/components/ChildCard.svelte'
    ],
    'scoped-props/demos/SpreadForwarding.svelte': [
        'scoped-props/demos/components/spread/MiddleSpreadCard.svelte',
        'scoped-props/demos/components/spread/SpreadGrandchildCard.svelte'
    ],
    'scoped-props/demos/SsrLiteral.svelte': [
        'scoped-props/demos/SsrProbe.svelte',
        'scoped-props/demos/components/ChildCard.svelte'
    ]
}

function demoCodeLabelForKey(key: DemoCodeLoaderKey): string {
    return key.split('/').pop() ?? key
}

function demoCodeIdForKey(baseId: string, key: DemoCodeLoaderKey, index: number): string {
    if (index === 0) return baseId

    const fileName = demoCodeLabelForKey(key).replace(/\.svelte$/, '')
    const slug = fileName
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()

    return `${baseId}-${slug || index}`
}

/**
 * Builds lazy `CodeReferenceV2` samples for a demo entrypoint and every
 * co-located `.svelte` component imported by that demo.
 *
 * @param key - Demo path emitted by `demoManifestPlugin({ split: true })`.
 * @param id - Stable sample identifier for the demo entrypoint.
 * @param label - Human-readable file label for the demo entrypoint.
 * @param preload - Optional override for docs-kit's idle preload behavior.
 * @returns Lazy code samples for the demo followed by local component dependencies.
 */
export function demoCodeSamples(
    key: DemoCodeLoaderKey,
    id: string,
    label: string,
    preload?: 'idle' | false
): DemoCodeSample[] {
    const keys = [key, ...(demoCodeDependencies[key] ?? [])]
    return keys.map((sampleKey, index) =>
        demoCodeSample(
            sampleKey,
            demoCodeIdForKey(id, sampleKey, index),
            index === 0 ? label : demoCodeLabelForKey(sampleKey),
            preload
        )
    )
}
