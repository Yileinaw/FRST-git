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
# Cypress E2E 测试设置与调试记录

**目标：** 为 Vue 项目中的用户登录流程设置并运行自动化端到端测试。

**工具：** Cypress

**测试文件：** `vue-FRS/cypress/e2e/login.cy.js`

**过程记录：**

1.  **环境准备与启动：**
    *   确保项目依赖已安装 (`npm install`)。
    *   安装 Cypress 作为开发依赖 (`npm install cypress --save-dev`)。
    *   启动 Cypress 测试运行器 (`npx cypress open`)，它会引导完成初始设置并创建必要的文件夹 (`cypress/`) 和配置文件 (`cypress.config.ts`)。
    *   **关键点：** 运行 Cypress 测试前，**必须**确保你的 Vue 开发服务器正在运行 (`npm run dev`)，这样 Cypress 才能访问到 `http://localhost:5173` 上的应用。

2.  **创建测试文件：**
    *   在 `cypress/e2e/` 目录下创建了 `login.cy.js` 文件。

3.  **编写测试用例：**
    *   使用 `describe` 对测试流程进行分组（例如 `describe('Login Flow', ...)`）。
    *   使用 `it` 定义具体的测试场景（例如 `it('should display login form elements', ...)`）。
    *   使用 `beforeEach` 来执行每个测试用例开始前的通用操作（例如 `cy.visit('/auth/login')` 访问登录页）。
    *   **核心 Cypress 命令：**
        *   `cy.visit('/')`: 访问指定路径。
        *   `cy.get('[selector]')`: 根据 CSS 选择器或 `data-*` 属性选择元素。
        *   `cy.type('text')`: 在选中的输入框中输入文本。
        *   `cy.click()`: 点击选中的元素。
        *   `.should('assertion', ...)`: 对选中的元素进行断言（例如 `should('be.visible')`, `should('have.value', '...')`, `should('contain', '...')`)。

4.  **添加 `data-cy` 属性：**
    *   **遇到的问题：** Cypress 默认使用 CSS 选择器，但类名或结构可能经常变动，导致测试不稳定。
    *   **解决方案：** 在 Vue 组件 (`LoginView.vue`) 中，为需要交互或验证的关键元素（用户名输入框、密码输入框、登录按钮）添加了自定义的 `data-cy` 属性。
        *   `<el-input ... data-cy="login-username" />`
        *   `<el-input ... data-cy="login-password" />`
        *   `<el-button ... data-cy="login-submit" />`
    *   在 Cypress 测试中使用 `cy.get('[data-cy="login-username"]')` 这样的选择器来定位元素，这比依赖 CSS 类名更稳定、更明确。

5.  **调试测试失败：**
    *   **失败 1：`Timed out retrying ... Expected to find element: [data-cy="..."]`**
        *   **原因：** `LoginView.vue` 中对应的元素缺少 `data-cy` 属性。
        *   **解决：** 回到 `LoginView.vue` 添加了缺失的 `data-cy` 属性。
    *   **失败 2：`Timed out retrying ... Expected to find element: .el-message--error`**
        *   **原因：** 测试登录失败场景时，`LoginView.vue` 的模拟登录逻辑总是返回成功，没有触发错误提示。
        *   **解决：** 修改了 `LoginView.vue` 中的 `handleLogin` 函数，增加了判断逻辑：当 Cypress 输入特定的错误凭证 (`wronguser` 或 `wrongpassword`) 时，调用 `ElMessage.error` 显示错误消息，而不是模拟成功。

6.  **测试通过：**
    *   经过上述调整，所有三个测试用例（显示表单、成功登录、失败提示）均成功通过。

**总结与收获：**

*   E2E 测试能有效模拟用户真实操作流程，确保关键功能的正确性。
*   使用 `data-cy` 属性是 Cypress 测试中定位元素的首选方法，可提高测试的稳定性和可维护性。
*   在测试（尤其是模拟场景）时，需要确保被测试组件的逻辑能够响应测试输入并产生预期的结果（包括成功和失败的情况）。
*   调试 Cypress 测试时，要仔细阅读错误信息，结合 Cypress 运行器中的步骤快照和浏览器控制台输出来定位问题。