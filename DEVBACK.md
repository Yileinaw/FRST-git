# 后端 API 接口设计 (基于 vue-FRS 前端页面)

本文档根据 `vue-FRS/src/views` 目录下的前端页面结构，梳理了为支持前端功能所需的后端 API 接口。

**1. 认证 (Authentication)**

*   对应页面: `views/auth/LoginView.vue`, `views/auth/RegisterView.vue`
*   **`POST /api/auth/register`**: 用户注册
    *   请求体: `{ username, email, password }`
    *   响应: 成功时返回用户信息 (不含密码哈希)，失败时返回错误信息。
*   **`POST /api/auth/login`**: 用户登录
    *   请求体: `{ emailOrUsername, password }`
    *   响应: 成功时返回认证凭证 (如 JWT Token) 和用户信息，失败时返回错误信息。
*   **`POST /api/auth/logout`**: 用户登出 (可选，取决于认证机制)
    *   请求体: (可能需要携带认证凭证)
    *   响应: 成功登出确认。

**2. 用户 (Users)**

*   对应页面: `views/profile/Index.vue`, `views/profile/Settings.vue`
*   **`GET /api/users/me`**: 获取当前登录用户信息
    *   请求头: 需要认证凭证
    *   响应: 当前用户的详细信息 (用户名、邮箱、创建时间等)。
*   **`PUT /api/users/me`**: 更新当前登录用户信息
    *   请求头: 需要认证凭证
    *   请求体: `{ username?, email? }` (或其他允许修改的字段)
    *   响应: 更新后的用户信息。
*   **`PUT /api/users/me/password`**: 修改当前登录用户密码
    *   请求头: 需要认证凭证
    *   请求体: `{ currentPassword, newPassword }`
    *   响应: 成功修改确认或错误信息。
*   **`GET /api/users/{userId}`**: 获取指定用户的公开信息 (如果需要查看他人主页)
    *   响应: 指定用户的公开信息 (如用户名、发布的帖子等)。

**3. 社区帖子 (Community Posts)**

*   对应页面: `views/community/CommunityView.vue`, `views/community/PostDetail.vue`
*   **`GET /api/posts`**: 获取帖子列表
    *   查询参数: `?page=1&limit=10&sortBy=createdAt&filter=...` (分页、排序、筛选)
    *   响应: 帖子列表数组。
*   **`POST /api/posts`**: 创建新帖子
    *   请求头: 需要认证凭证
    *   请求体: `{ title, content, images?, ... }`
    *   响应: 创建成功的帖子信息。
*   **`GET /api/posts/{postId}`**: 获取指定帖子详情
    *   响应: 帖子的详细信息，包括作者信息、评论等。
*   **`PUT /api/posts/{postId}`**: 更新指定帖子 (仅限作者)
    *   请求头: 需要认证凭证
    *   请求体: `{ title?, content?, images?, ... }`
    *   响应: 更新后的帖子信息。
*   **`DELETE /api/posts/{postId}`**: 删除指定帖子 (仅限作者)
    *   请求头: 需要认证凭证
    *   响应: 成功删除确认。
*   **`GET /api/posts/{postId}/comments`**: 获取帖子的评论列表
    *   查询参数: `?page=1&limit=10`
    *   响应: 评论列表数组。
*   **`POST /api/posts/{postId}/comments`**: 为帖子添加评论
    *   请求头: 需要认证凭证
    *   请求体: `{ commentContent }`
    *   响应: 创建成功的评论信息。
*   **`POST /api/posts/{postId}/like`**: 点赞/取消点赞帖子 (需要设计好状态切换)
    *   请求头: 需要认证凭证
    *   响应: 当前帖子的点赞状态和数量。

**4. 食品 (Food)**

*   对应页面: `views/food/FoodDetailView.vue`
*   **`GET /api/food`**: 获取食品列表 (可能用于发现页或搜索)
    *   查询参数: `?search=...&category=...&page=1&limit=10`
    *   响应: 食品列表数组。
*   **`GET /api/food/{foodId}`**: 获取指定食品详情
    *   响应: 食品的详细信息、评分、评论等。
*   **`POST /api/food/{foodId}/reviews`**: 添加食品评论/评分 (如果需要)
    *   请求头: 需要认证凭证
    *   请求体: `{ rating, comment }`
    *   响应: 创建成功的评论信息。
*   **`GET /api/food/{foodId}/reviews`**: 获取食品的评论/评分列表 (如果需要)
    *   查询参数: `?page=1&limit=10`
    *   响应: 评论列表。

**5. 餐厅 (Restaurants)**

*   对应页面: `views/restaurant/DetailView.vue`
*   **`GET /api/restaurants`**: 获取餐厅列表 (可能用于发现页或搜索)
    *   查询参数: `?search=...&location=...&page=1&limit=10`
    *   响应: 餐厅列表数组。
*   **`GET /api/restaurants/{restaurantId}`**: 获取指定餐厅详情
    *   响应: 餐厅的详细信息、评分、评论、提供的食品等。
*   **`POST /api/restaurants/{restaurantId}/reviews`**: 添加餐厅评论/评分 (如果需要)
    *   请求头: 需要认证凭证
    *   请求体: `{ rating, comment }`
    *   响应: 创建成功的评论信息。
*   **`GET /api/restaurants/{restaurantId}/reviews`**: 获取餐厅的评论/评分列表 (如果需要)
    *   查询参数: `?page=1&limit=10`
    *   响应: 评论列表。

**6. 收藏 (Collections)**

*   对应页面: `views/collection/Index.vue`
*   **`GET /api/collections`**: 获取当前用户的收藏列表
    *   请求头: 需要认证凭证
    *   查询参数: `?type=food/restaurant/post` (可选，用于筛选类型)
    *   响应: 用户收藏的项目列表 (包含项目类型和ID)。
*   **`POST /api/collections`**: 添加项目到收藏
    *   请求头: 需要认证凭证
    *   请求体: `{ itemType: 'food' | 'restaurant' | 'post', itemId }`
    *   响应: 成功添加确认。
*   **`DELETE /api/collections/{collectionItemId}`**: 从收藏中移除项目 (需要定义 `collectionItemId` 或用类型+项目ID删除)
    *   请求头: 需要认证凭证
    *   或者: `DELETE /api/collections?itemType=food&itemId=123`
    *   响应: 成功移除确认。

**7. 发现/搜索 (Discover/Search)**

*   对应页面: `views/discover/DiscoverView.vue`
*   **`GET /api/discover` 或 `GET /api/search`**: 执行全局搜索或获取推荐
    *   查询参数: `?query=...&type=food/restaurant/post/user&sortBy=relevance/popularity`
    *   响应: 搜索结果或推荐列表。

**说明:**

*   `{xxxId}` 表示路径参数。
*   `?xxx=yyy` 表示查询参数。
*   `?` 表示可选参数或字段。
*   需要认证凭证的接口通常在请求头中携带 `Authorization: Bearer <token>`。
*   错误处理：所有接口都应包含适当的错误处理和状态码 (400, 401, 403, 404, 409, 500等)。
*   数据模型：以上接口依赖于后端数据库中相应的表结构 (如 `posts`, `comments`, `food_items`, `restaurants`, `reviews`, `collections` 等)。这需要在 `prisma/schema.prisma` 文件中进一步定义。

---

# 开发过程记录

1.  **项目初始化与数据库设置:**
    *   创建 `backend` 目录作为后端项目根目录。
    *   使用 `npm init -y` 初始化 Node.js 项目。
    *   根据用户要求，选用 `MySQL` 作为数据库。
    *   使用 `npx prisma init --datasource-provider mysql` 初始化 Prisma，配置 ORM。
    *   在 `.env` 文件中配置 `DATABASE_URL` 指向 `FEDB` 数据库及用户凭证，并添加 `JWT_SECRET` 用于 Token 签名。

2.  **数据库模型与迁移:**
    *   在 `prisma/schema.prisma` 文件中定义了数据模型，包括 `User`, `UserAction`, `Post`, `Comment`, `Like`, `FoodItem`, `Restaurant`, `Review`, 和 `CollectionItem`，以及它们之间的关联关系。
    *   处理了 Prisma 在 MySQL 上不支持 `String[]` 的问题，将其改为 `Json?`。
    *   添加了缺失的双向关系和显式的外键约束名称 (`map`) 以修复验证错误。
    *   通过删除旧迁移历史和清空 `_prisma_migrations` 表，解决了持续的数据库漂移 (`Drift detected`) 问题。
    *   运行 `npx prisma migrate dev --name initial_schema` 成功生成并应用了包含所有模型的初始数据库迁移。

3.  **依赖安装:**
    *   安装了核心依赖: `express`, `@prisma/client`, `bcrypt`, `jsonwebtoken`, `dotenv`。
    *   安装了开发依赖: `prisma`。

4.  **API 接口实现 (基于 `DEVBACK.md` 初版设计):**
    *   **认证:** 实现了 `/api/auth/register` 和 `/api/auth/login` 接口，使用 `bcrypt` 处理密码哈希，使用 `jsonwebtoken` 生成 JWT。
    *   **认证中间件:** 创建了 `middleware/auth.js`，用于验证请求头中的 JWT，并将用户信息附加到 `req.user`。
    *   **用户:** 实现了 `/api/users/me` (获取信息), `/api/users/me` (更新信息), `/api/users/me/password` (修改密码), `/api/users/:userId` (获取指定用户信息) 接口，需要认证的接口均使用了 `authenticateToken` 中间件。
    *   **帖子:** 实现了 `/api/posts` (列表, 分页排序), `/api/posts` (创建), `/api/posts/:postId` (详情), `/api/posts/:postId` (更新, 含权限检查), `/api/posts/:postId` (删除, 含权限检查)。
    *   **评论:** 实现了 `/api/posts/:postId/comments` (列表, 分页), `/api/posts/:postId/comments` (创建)。
    *   **点赞:** 实现了 `/api/posts/:postId/like` (切换点赞状态)。
    *   **食品:** 实现了 `/api/food` (列表, 分页), `/api/food/:foodId` (详情), `/api/food/:foodId/reviews` (列表, 分页), `/api/food/:foodId/reviews` (创建, 含防重检查)。
    *   **餐厅:** 实现了 `/api/restaurants` (列表, 分页), `/api/restaurants/:restaurantId` (详情), `/api/restaurants/:restaurantId/reviews` (列表, 分页), `/api/restaurants/:restaurantId/reviews` (创建, 含防重检查)。
    *   **收藏:** 实现了 `/api/collections` (列表, 分页, 类型过滤), `/api/collections` (创建, 含存在性检查), `/api/collections` (删除, 使用 query 参数)。
    *   **搜索:** 实现了 `/api/search` (基础跨模型搜索)。

5.  **代码结构优化 (路由重构):**
    *   创建了 `routes` 目录。
    *   将各个模块 (auth, users, posts, food, restaurants, collections, search) 的路由逻辑分别拆分到 `routes/` 目录下的对应文件中，使用 `express.Router`。
    *   更新了 `server.js`，移除具体的路由处理逻辑，改为引入并使用 (`app.use`) 这些路由模块。 