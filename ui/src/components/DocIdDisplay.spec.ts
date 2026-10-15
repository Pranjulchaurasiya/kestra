import {describe, test, expect, vi, beforeEach, afterEach} from "vitest"
import {mount} from "@vue/test-utils"
import {reactive} from "vue"
import DocIdDisplay from "./DocIdDisplay.vue"
import ContentCopy from "vue-material-design-icons/ContentCopy.vue"
import CheckCircle from "vue-material-design-icons/CheckCircle.vue"
import * as Utils from "../utils/utils"

const route = reactive({
    query: {} as Record<string, string | undefined>,
})

const docStore = reactive({
    docId: "core.tasks",
})

vi.mock("vue-router", () => ({
    useRoute: () => route,
}))

vi.mock("../stores/doc", () => ({
    useDocStore: () => docStore,
}))

describe("DocIdDisplay", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        route.query = {}
        docStore.docId = "core.tasks"
        vi.spyOn(Utils, "copy").mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    test("nothing renders without the showDocId query parameter", () => {
        route.query = {}
        const wrapper = mount(DocIdDisplay)
        expect(wrapper.find(".app-id-display-box").exists()).toBe(false)
        expect(wrapper.html()).toBe("<!--v-if-->")
    })

    test("it renders when the parameter is present, even with no value", () => {
        route.query = {showDocId: ""}
        const wrapper = mount(DocIdDisplay)
        expect(wrapper.find(".app-id-display-box").exists()).toBe(true)
    })

    test("the text is docId: <id> from the doc store", () => {
        route.query = {showDocId: "true"}
        docStore.docId = "my.plugin.task"
        const wrapper = mount(DocIdDisplay)
        expect(wrapper.text()).toContain("docId: my.plugin.task")
    })

    test("clicking copies that exact text", async () => {
        route.query = {showDocId: "true"}
        docStore.docId = "flowable.switch"
        const wrapper = mount(DocIdDisplay)

        await wrapper.find("button").trigger("click")
        expect(Utils.copy).toHaveBeenCalledTimes(1)
        expect(Utils.copy).toHaveBeenCalledWith("docId: flowable.switch")
    })

    test("the tick replaces the copy icon after a click and reverts to the copy icon after two seconds", async () => {
        route.query = {showDocId: "true"}
        const wrapper = mount(DocIdDisplay)

        // Initially copy icon is visible, tick is not
        expect(wrapper.findComponent(ContentCopy).exists()).toBe(true)
        expect(wrapper.findComponent(CheckCircle).exists()).toBe(false)

        // Click to trigger copy
        await wrapper.find("button").trigger("click")
        await wrapper.vm.$nextTick()

        // Tick replaces copy icon
        expect(wrapper.findComponent(CheckCircle).exists()).toBe(true)
        expect(wrapper.findComponent(ContentCopy).exists()).toBe(false)

        // Fast-forward 1999ms - still tick
        vi.advanceTimersByTime(1999)
        await wrapper.vm.$nextTick()
        expect(wrapper.findComponent(CheckCircle).exists()).toBe(true)
        expect(wrapper.findComponent(ContentCopy).exists()).toBe(false)

        // Fast-forward 1ms more (total 2000ms) - reverts to copy icon
        vi.advanceTimersByTime(1)
        await wrapper.vm.$nextTick()
        expect(wrapper.findComponent(CheckCircle).exists()).toBe(false)
        expect(wrapper.findComponent(ContentCopy).exists()).toBe(true)
    })
})
