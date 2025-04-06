# FRST-git 单元测试说明

本文档记录 FRST-git 项目单元测试的相关信息。

## 1. 目标

验证项目中最小的可测试单元的逻辑正确性，主要包括：

*   工具函数 (`src/utils/`)
*   状态管理逻辑 (Pinia Stores in `src/store/modules/`)
*   复杂的计算属性或独立的业务逻辑函数

## 2. 工具

*   测试运行器: `Vitest`
*   断言库: `Vitest` (内建 `expect`)
*   辅助库: `happy-dom` (用于模拟 DOM，虽然纯逻辑单元测试不一定需要)

## 3. 编写规范

*   测试文件命名: 遵循 `[被测文件名].spec.ts` 或 `[被测文件名].test.ts`。
*   测试文件位置: 建议放在被测试文件的相同目录下，方便查找。
*   测试结构: 使用 `describe` 组织测试套件，`it` 或 `test` 定义单个测试用例。
*   测试描述: 清晰说明测试的目的和预期行为。
*   断言: 使用 `expect` 进行断言，确保覆盖各种边界条件和核心逻辑。
*   隔离性: 单元测试应尽可能独立，避免依赖外部服务或复杂状态。必要时使用 Mock。

## 4. 当前覆盖范围 (示例)

*   [x] `src/utils/timeFormatter.ts` - `formatRelativeTime` 函数
*   [ ] `src/utils/validators.ts` (如果存在)
*   [ ] Pinia Store 核心 Actions/Getters (如 `userStore`, `collectionStore`)

## 5. 运行测试

```bash
npm run test:unit
``` 