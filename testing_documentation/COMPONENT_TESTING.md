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

## 4. 建议覆盖的组件 (示例)

*   **展示型组件:**
    *   `FoodCard.vue`: 验证根据传入的 `food` prop 正确显示名称、图片、价格、评分等。
    *   `RestaurantCard.vue`: 类似 FoodCard。
    *   `PostItem.vue`: 验证帖子信息展示。
    *   `CommentList.vue`: 验证评论列表渲染，处理空列表情况。
    *   `CollectionList.vue`: 验证收藏项渲染，类型角标显示。
*   **交互型组件:**
    *   `CreatePostDialog.vue`: 验证表单输入、图片上传交互、按钮点击、事件触发。
    *   各种表单组件 (如 `LoginView.vue`, `RegisterView.vue`, `Settings.vue` 中的表单部分): 验证输入、校验逻辑、提交事件。
*   **布局组件:**
    *   `DefaultLayout.vue`: 验证 Slot 渲染，导航链接（可 Mock Router）。

## 5. 运行测试

单元测试和组件测试通常一起运行：

```bash
npm run test:unit
``` 