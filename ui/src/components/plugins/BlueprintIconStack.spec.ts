import {describe, test, expect, beforeEach, afterAll, vi} from "vitest"
import {mount} from "@vue/test-utils"
import KestraDesignSystem from "@kestra-io/design-system"
import BlueprintIconStack from "./BlueprintIconStack.vue"
import TaskIcon from "./TaskIcon.vue"

const globalConfig = {
    plugins: [KestraDesignSystem],
}

const mockIcons = {
    "io.kestra.plugin.core.log": {flowable: false, monochrome: false, hasIcon: true},
    "io.kestra.plugin.scripts.python": {flowable: false, monochrome: false, hasIcon: true},
    "Standalone": {flowable: false, monochrome: false, hasIcon: true},
}

describe("BlueprintIconStack", () => {
    let resizeCallback: (entries: Array<{contentRect: {width: number}}>) => void

    beforeEach(() => {
        // Mock ResizeObserver safely with vi.stubGlobal
        vi.stubGlobal("ResizeObserver", class {
            constructor(callback: (entries: Array<{contentRect: {width: number}}>) => void) {
                resizeCallback = callback
            }
            observe() {}
            unobserve() {}
            disconnect() {}
        })
    })

    afterAll(() => {
        vi.unstubAllGlobals()
    })

    test("dedupes classes by their parent package so multiple tasks in the same plugin yield one icon", () => {
        const wrapper = mount(BlueprintIconStack, {
            props: {
                clses: [
                    "io.kestra.plugin.core.log.Log",
                    "io.kestra.plugin.core.log.Print",
                    "io.kestra.plugin.scripts.python.Commands",
                ],
                icons: mockIcons,
            },
            global: globalConfig,
        })

        const icons = wrapper.findAllComponents(TaskIcon)
        // Two tasks share 'io.kestra.plugin.core.log', one in 'io.kestra.plugin.scripts.python'
        // Expected unique parent count = 2
        expect(icons.length).toBe(2)
        expect(icons[0].props("cls")).toBe("io.kestra.plugin.core.log")
        expect(icons[1].props("cls")).toBe("io.kestra.plugin.scripts.python")
    })

    test("uses class with no dot as its own parent", () => {
        const wrapper = mount(BlueprintIconStack, {
            props: {
                clses: ["Standalone"],
                icons: mockIcons,
            },
            global: globalConfig,
        })

        const icons = wrapper.findAllComponents(TaskIcon)
        expect(icons.length).toBe(1)
        expect(icons[0].props("cls")).toBe("Standalone")
    })

    test("collapses to +N badge when container width fits fewer icons than unique classes", async () => {
        const wrapper = mount(BlueprintIconStack, {
            props: {
                clses: [
                    "io.kestra.plugin.core.log.Log",
                    "io.kestra.plugin.scripts.python.Commands",
                    "io.kestra.plugin.fs.http.Download",
                    "io.kestra.plugin.jdbc.postgres.Query",
                ],
                icons: mockIcons,
            },
            global: globalConfig,
        })

        // 4 unique parents. With no width set, all 4 icons render and no +N badge
        expect(wrapper.findAllComponents(TaskIcon).length).toBe(4)
        expect(wrapper.find(".blueprint-icon-stack__more").exists()).toBe(false)

        // Trigger ResizeObserver with narrow width (e.g. 50px fits 1 icon with gap)
        // ICON_PX=24, GAP_PX=8. (50 + 8) / (24 + 8) = 1 fitting.
        // visible = slice(0, 1 - 1) = 0, or with 70px (70+8)/(32) = 2 fitting -> 1 icon visible, 3 overflow.
        resizeCallback([{contentRect: {width: 70}}])
        await wrapper.vm.$nextTick()

        const visibleIcons = wrapper.findAllComponents(TaskIcon)
        expect(visibleIcons.length).toBe(1)

        const moreBadge = wrapper.find(".blueprint-icon-stack__more")
        expect(moreBadge.exists()).toBe(true)
        expect(moreBadge.text()).toBe("+3")
    })
})
