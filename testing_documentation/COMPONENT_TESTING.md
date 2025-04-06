# FRST-git 组件测试说明

本文档记录 FRST-git 项目 Vue 组件测试的相关信息。

## 1. 目标

验证单个 Vue 组件的功能是否符合预期，包括：

*   正确渲染 Props 传入的数据。
*   根据不同 Props 或内部状态显示/隐藏元素。
*   用户交互（点击、输入等）后触发正确的事件或方法调用。
*   Slots 内容的正确渲染。
*   组件挂载、更新、卸载等生命周期钩子的行为（必要时）。

## 2. 工具

*   测试运行器: `Vitest`
*   Vue 测试库: `@vue/test-utils` (提供 `mount`, `shallowMount`, `findComponent`, `trigger` 等 API)
*   DOM 环境模拟: `happy-dom` (由 Vitest 配置)
*   断言库: `Vitest` (`expect`)

## 3. 编写规范

*   测试文件命名: 遵循 `[组件名].spec.ts` 或 `[组件名].test.ts`。
*   测试文件位置: 建议放在与组件文件相同的目录下，或统一的 `tests/component` 目录。
*   挂载组件: 使用 `@vue/test-utils` 的 `mount` (完全挂载，包含子组件) 或 `shallowMount` (仅挂载当前组件，子组件存根) 方法。
*   查找元素: 使用 `wrapper.find()`, `wrapper.findAll()`, `wrapper.get()` 等方法，推荐使用 `data-testid` 属性作为稳定的选择器。
*   触发交互: 使用 `wrapper.trigger('click')`, `wrapper.setValue()` 等方法模拟用户操作。
*   断言: 验证渲染输出 (`wrapper.html()`, `wrapper.text()`, `wrapper.isVisible()`), 事件触发 (`wrapper.emitted()`), Props/State 变化等。
*   模拟依赖: 对组件依赖的 Store、Router、全局方法或子组件进行 Mock 或 Stub。

## 4. 当前覆盖范围与记录

*   **展示型组件:**
    *   **[x] `src/components/business/FoodCard.vue`**
        *   **状态:** 已完成基本 Props 渲染测试并通过。
        *   **记录:**
            *   验证了名称 (`span.name`)、价格 (`span.price`)、图片 (`img.image`)、标签 (`div.tags .el-tag`) 的正确渲染和空状态处理。
            *   评分 (`el-rate`) 的测试遇到了困难：
                *   最初尝试检查文本内容失败。
                *   尝试使用 `@vue/test-utils` 的 `findComponent` 和 `global.stubs` 来查找存根并检查 props，但无论使用简单存根、显式存根、PascalCase 还是 kebab-case 名称，`findComponent` 均无法稳定找到存根 (`rateStub.exists()` 持续失败)。
                *   **最终解决方案:** 改为检查条件渲染相关的 DOM 元素：使用 `wrapper.find('el-rate-stub').exists()` 和 `wrapper.find('.no-rating').exists()` 来断言 `el-rate` 或"暂无评分"文本是否按预期显示。
            *   **待办:** 测试点击事件 (`@click`) 是否触发 (如果需要)。
    *   [ ] `RestaurantCard.vue`
    *   [ ] `PostItem.vue`
    *   [ ] `CommentList.vue`
    *   [ ] `CollectionList.vue`
*   **交互型组件:**
    *   [ ] `CreatePostDialog.vue`
    *   [ ] 其他表单组件...
*   **布局组件:**
    *   [ ] `DefaultLayout.vue`

## 5. 运行测试

单元测试和组件测试通常一起运行：

```bash
npm run test:unit
``` 