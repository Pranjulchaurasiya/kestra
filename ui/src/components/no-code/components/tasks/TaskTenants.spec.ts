import {describe, expect, test} from "vitest"
import {computed} from "vue"
import KestraDesignSystem from "@kestra-io/design-system"
import TaskTenants from "./TaskTenants.vue"
import {TENANTS_INJECTION_KEY} from "../../injectionKeys"
import {i18nMount} from "../../../../../tests/unit/i18nMount"

describe("TaskTenants", () => {
    test("three or fewer tenants all render as visible tags, with nothing hidden", () => {
        const wrapper = i18nMount(TaskTenants, {
            props: {
                modelValue: ["tenant-1", "tenant-2", "tenant-3"],
            },
            global: {
                plugins: [KestraDesignSystem],
            },
        })

        // All 3 tenants render as visible tags
        const tags = wrapper.findAllComponents({name: "KsTag"})
        expect(tags).toHaveLength(3)
        expect(tags.map(tag => tag.text().trim())).toEqual(["tenant-1", "tenant-2", "tenant-3"])

        // No hidden tags tooltip is rendered
        const tooltip = wrapper.findComponent({name: "KsTooltip"})
        expect(tooltip.exists()).toBe(false)
    })

    test("more than three renders the first three visible and the rest hidden", () => {
        const wrapper = i18nMount(TaskTenants, {
            props: {
                modelValue: ["tenant-1", "tenant-2", "tenant-3", "tenant-4", "tenant-5"],
            },
            global: {
                plugins: [KestraDesignSystem],
            },
        })

        // 4 tags in total: 3 visible tags + 1 collapse indicator tag (+2)
        const tags = wrapper.findAllComponents({name: "KsTag"})
        expect(tags).toHaveLength(4)
        expect(tags.slice(0, 3).map(tag => tag.text().trim())).toEqual(["tenant-1", "tenant-2", "tenant-3"])

        // The collapse tag shows +2 for the remaining 2 hidden tenants
        expect(tags[3].text().trim()).toBe("+2")

        // Tooltip exists and wraps the collapse indicator badge
        const tooltip = wrapper.findComponent({name: "KsTooltip"})
        expect(tooltip.exists()).toBe(true)
        expect(tooltip.text().trim()).toBe("+2")
    })

    test("an empty selection renders no tags", () => {
        const wrapper = i18nMount(TaskTenants, {
            props: {
                modelValue: [],
            },
            global: {
                plugins: [KestraDesignSystem],
            },
        })

        expect(wrapper.findAllComponents({name: "KsTag"})).toHaveLength(0)
        expect(wrapper.findComponent({name: "KsTooltip"}).exists()).toBe(false)
    })

    test("the model defaults to an empty array when nothing is bound", () => {
        const wrapper = i18nMount(TaskTenants, {
            global: {
                plugins: [KestraDesignSystem],
            },
        })

        expect(wrapper.findAllComponents({name: "KsTag"})).toHaveLength(0)
        expect((wrapper.vm as unknown as {modelValue: string[]}).modelValue).toEqual([])
    })

    test("the injected tenant list is used, and a missing provider falls back to an empty list", () => {
        // When provider is present with tenant definitions
        const mockTenants = computed(() => [
            {id: "tenant-a", name: "Alpha"},
            {id: "tenant-b"}, // name falls back to id
        ])

        const wrapperWithProvider = i18nMount(TaskTenants, {
            global: {
                plugins: [KestraDesignSystem],
                provide: {
                    [TENANTS_INJECTION_KEY as symbol]: mockTenants,
                },
            },
        })

        const options = wrapperWithProvider.findAllComponents({name: "KsOption"})
        expect(options).toHaveLength(2)
        expect(options[0].props("value")).toBe("tenant-a")
        expect(options[0].props("label")).toBe("Alpha")
        expect(options[1].props("value")).toBe("tenant-b")
        expect(options[1].props("label")).toBe("tenant-b")

        // When provider is missing, it falls back to an empty list
        const wrapperWithoutProvider = i18nMount(TaskTenants, {
            global: {
                plugins: [KestraDesignSystem],
            },
        })

        const fallbackOptions = wrapperWithoutProvider.findAllComponents({name: "KsOption"})
        expect(fallbackOptions).toHaveLength(0)
    })
})
