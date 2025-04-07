console.log('Seed script starting execution...');

console.log('Requiring @prisma/client...');
const { PrismaClient, CollectionType } = require('@prisma/client'); // Import CollectionType
console.log('Required @prisma/client');

console.log('Requiring bcrypt...');
const bcrypt = require('bcryptjs');
console.log('Required bcrypt');

console.log('Creating PrismaClient instance...');
const prisma = new PrismaClient();
console.log('Created PrismaClient instance');

// --- Configuration ---
const IMAGE_BASE_PATH = '/src/assets/images/TestImages/';
const testImages = [
    '东坡肉.jpg', '乌克兰土豆.jpg', '全家福寿司.jpg', '军舰寿司.jpg', '原切三文鱼.jpg',
    '口味虾.jpg', '叫花鸡.jpg', '多拼沙拉.jpg', '姑姑肉.jpg', '安格斯汉堡.jpg',
    '宫保鸡丁.jpg', '小酥肉.jpg', '意大利卷面.jpg', '旦旦面.jpg', '春卷.jpg',
    '杂烩海味.jpg', '板板肉.jpg', '柠檬土司.jpg', '水煮肉片.jpg', '油泼面.jpg',
    '法式早餐.jpg', '法式火鸡.jpg', '浓汤鸡杂.jpg', '海味寿司.jpg', '烤鸡柳.jpg',
    '焦香蛋卷.jpg', '牛肉拼盘.jpg', '玉米纳豆.jpg', '留一手龙虾.jpg', '白切鸡.jpg',
    '简单面.jpg', '紫罗兰冰激凌.jpg', '经典寿司.jpg', '经典意大利面.jpg', '经典扣肉.jpg',
    '羊肉串.jpg', '肉酱意面.jpg', '腊味拼盘.jpg', '腊肠披萨.jpg', '腊肠蛋挞.jpg',
    '蚕蛹炒肉.jpg', '蛋炒饭.jpg', '西冷焗汤.jpg', '西冷牛排.jpg', '辣子鸡.jpg',
    '辣椒牛肉.jpg', '雪里红炒肉.jpg', '香辣虾球.jpg', '鱼柳寿司.jpg', '鹅肝寿司.jpg'
].map(img => IMAGE_BASE_PATH + img); // Prepend base path

const DEFAULT_PASSWORD = 'password123';

// --- Helper Functions ---
function getRandomElement(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomElements(arr, count) {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => 0.5 - Math.random()); // Use spread to avoid modifying original
    return shuffled.slice(0, Math.min(count, arr.length));
}
function getRandomSubset(arr) {
    if (!arr || arr.length === 0) return [];
    return arr.filter(() => Math.random() > 0.5);
}

// --- Seeding Functions ---

async function seedUsers() {
    console.log('Seeding Users...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);
    const usersData = [
        { email: 'alice@example.com', username: 'Alice', password_hash: passwordHash, avatar: getRandomElement(testImages) },
        { email: 'bob@example.com', username: 'Bob', password_hash: passwordHash, avatar: getRandomElement(testImages) },
        { email: 'charlie@example.com', username: 'Charlie', password_hash: passwordHash, avatar: null },
    ];
    const createdUsers = [];
    for (const u of usersData) {
        try {
            const user = await prisma.user.create({ data: u });
            createdUsers.push(user);
            console.log(`  Created user: ${user.username} (ID: ${user.id})`);
        } catch (error) {
            console.error(`  Error creating user ${u.username}:`, error.message);
        }
    }
    return createdUsers;
}

async function seedRestaurants() {
    console.log('Seeding Restaurants...');
    const restaurantsData = [
        { name: '美味中餐厅', description: '地道中餐，家常风味', address: '北京路1号', imageUrl: getRandomElement(testImages) },
        { name: '萨莉亚意式餐厅', description: '平价美味的意式简餐', address: '上海路2号', imageUrl: getRandomElement(testImages) },
        { name: '深夜食堂日料', description: '温馨的日式居酒屋', address: '广州路3号', imageUrl: getRandomElement(testImages) },
        { name: '老美式汉堡店', description: '经典美式汉堡和薯条', address: '深圳路4号', imageUrl: getRandomElement(testImages) },
        { name: '街角咖啡馆', description: '放松心情的好去处', address: '成都路5号', imageUrl: getRandomElement(testImages) },
    ];
    const createdRestaurants = [];
    for (const r of restaurantsData) {
        try {
            const restaurant = await prisma.restaurant.create({ data: r });
            createdRestaurants.push(restaurant);
            console.log(`  Created restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
        } catch (error) {
            console.error(`  Error creating restaurant ${r.name}:`, error.message);
        }
    }
    return createdRestaurants;
}

async function seedFoodItems() {
    console.log('Seeding Food Items...');
    // NOTE: FoodItem is NOT directly linked to Restaurant in the current schema
    const foodNames = ['宫保鸡丁', '水煮肉片', '东坡肉', '麻婆豆腐', '鱼香肉丝', '经典意面', '肉酱意面', '玛格丽特披萨', '海鲜披萨', '三文鱼寿司', '鳗鱼寿司', '天妇罗', '拉面', '牛肉汉堡', '芝士汉堡', '炸鸡', '卡布奇诺', '拿铁', '美式咖啡'];
    const createdFoodItems = [];
    for (let i = 0; i < 15; i++) {
        const foodData = {
            name: getRandomElement(foodNames) + ` #${i + 1}`, // Ensure some uniqueness
            description: '美味可口',
            // price: REMOVED, // Price field removed based on schema
            imageUrl: getRandomElement(testImages),
            category: getRandomElement(['中餐', '西餐', '日料', '快餐', '饮品', null]) // Add category
        };
        try {
            const food = await prisma.foodItem.create({ data: foodData });
            createdFoodItems.push(food);
            console.log(`  Created food item: ${food.name} (ID: ${food.id})`);
        } catch (error) {
            console.error(`  Error creating food item ${foodData.name}:`, error.message);
        }
    }
    return createdFoodItems;
}

async function seedPosts(users) {
    // ... (seedPosts function remains the same as before) ...
    if (!users || users.length === 0) {
        console.log('Skipping Posts: No users available.');
        return [];
    }
    console.log('Seeding Posts...');
    const postTitles = ['今天天气真好', '发现一家宝藏地点', '我的周末生活', '编程心得分享', '最近看的好书', '旅行日记', '健身打卡', '美食体验', '电影推荐', '音乐分享'];
    const postContents = ['内容详情...\n今天是个好日子...', '这里的xxx真的超赞，强烈推荐！', '周末和朋友一起出去玩了，很开心！', '最近在学习 xxx，遇到了一些问题，解决了！', '推荐大家看《xxx》，非常有启发。', '去了 xxx 地方，风景很美。', '今天练了xxx，感觉棒棒哒！', '打卡网红点 xxx。', '《xxx》这部电影值得一看。', '分享一首最近单曲循环的歌。'];
    const createdPosts = [];
    for (let i = 0; i < 10; i++) { // Create 10 posts
        const author = getRandomElement(users);
        const numImages = Math.floor(Math.random() * 4); // 0-3 images
        const imageUrlsArray = numImages > 0 ? getRandomElements(testImages, numImages) : [];
        const postData = {
            title: getRandomElement(postTitles),
            content: getRandomElement(postContents),
            authorId: author.id, // Keep authorId for the relation scalar field
            imageUrls: imageUrlsArray.length > 0 ? imageUrlsArray : undefined,
        };
        try {
            // No explicit connect needed here if authorId is provided and relation is setup correctly
            const post = await prisma.post.create({ data: postData });
            createdPosts.push(post);
            console.log(`  Created post: "${post.title.substring(0, 20)}..." (ID: ${post.id}) by User ${author.id}`);
        } catch (error) {
            console.error(`  Error creating post "${postData.title}":`, error.message);
            console.error('  Post Data:', postData);
        }
    }
    return createdPosts;
}

async function seedComments(users, posts) {
    // ... (seedComments function remains the same as before) ...
    if (!users || users.length === 0 || !posts || posts.length === 0) {
        console.log('Skipping Comments: No users or posts available.');
        return;
    }
    console.log('Seeding Comments...');
    const commentContents = ['沙发！', '写得真好！', '同意！', '看起来不错👍', '学习了', '赞！', '哈哈哈', '有点意思', '感谢分享', '收藏了'];
    for (const post of getRandomSubset(posts)) {
        const numComments = Math.floor(Math.random() * 4);
        for (let i = 0; i < numComments; i++) {
            const author = getRandomElement(users);
            const commentData = {
                content: getRandomElement(commentContents),
                postId: post.id, // Keep postId for the relation scalar field
                authorId: author.id, // Keep authorId for the relation scalar field
            };
            try {
                // No explicit connect needed here if foreign keys are provided
                await prisma.comment.create({ data: commentData });
                console.log(`  Created comment on Post ${post.id} by User ${author.id}`);
            } catch (error) {
                console.error(`  Error creating comment on Post ${post.id}:`, error.message);
            }
        }
    }
}

async function seedLikes(users, posts) {
    // ... (seedLikes function remains the same as before, using upsert is fine) ...
    if (!users || users.length === 0 || !posts || posts.length === 0) {
        console.log('Skipping Likes: No users or posts available.');
        return;
    }
    console.log('Seeding Likes...');
    for (const user of users) {
        for (const post of getRandomSubset(posts)) {
            const likeData = {
                userId: user.id,
                postId: post.id,
            };
            try {
                await prisma.like.upsert({
                    where: { userId_postId: { userId: user.id, postId: post.id } },
                    update: {},
                    create: likeData,
                });
                console.log(`  User ${user.id} liked Post ${post.id}`);
            } catch (error) {
                console.error(`  Error creating like for User ${user.id} on Post ${post.id}:`, error.message);
            }
        }
    }
}

async function seedReviews(users, restaurants, foodItems) {
    if (!users || users.length === 0 || ((!restaurants || restaurants.length === 0) && (!foodItems || foodItems.length === 0))) {
        console.log('Skipping Reviews: No users or items to review.');
        return;
    }
    console.log('Seeding Reviews...');
    const reviewTexts = ['味道不错，环境也好。', '服务态度很好，推荐！', '一般般，性价比不高。', '踩雷了，不会再来。', '份量很足，味道可以。', '环境优雅，适合约会。', '上菜有点慢。'];

    // Review Restaurants
    if (restaurants && restaurants.length > 0) {
        for (const user of users) {
            for (const restaurant of getRandomSubset(restaurants)) {
                const reviewData = {
                    rating: Math.floor(Math.random() * 5) + 1,
                    comment: getRandomElement(reviewTexts),
                    // Connect author relation explicitly
                    author: { connect: { id: user.id } },
                    restaurant: { connect: { id: restaurant.id } }, // Connect restaurant relation
                    // userId: user.id, // No longer needed if connecting author
                    // restaurantId: restaurant.id, // No longer needed if connecting restaurant
                };
                try {
                    await prisma.review.create({ data: reviewData });
                    console.log(`  User ${user.id} reviewed Restaurant ${restaurant.id}`);
                } catch (error) {
                    console.error(`  Error creating review for User ${user.id} on Restaurant ${restaurant.id}:`, error.message);
                }
            }
        }
    }

    // Review Food Items
    if (foodItems && foodItems.length > 0) {
        for (const user of users) {
            for (const food of getRandomSubset(foodItems)) {
                const reviewData = {
                    rating: Math.floor(Math.random() * 5) + 1,
                    comment: getRandomElement(reviewTexts),
                    // Connect author relation explicitly
                    author: { connect: { id: user.id } },
                    foodItem: { connect: { id: food.id } }, // Connect foodItem relation
                    // userId: user.id, // No longer needed
                    // foodItemId: food.id, // No longer needed
                };
                try {
                    await prisma.review.create({ data: reviewData });
                    console.log(`  User ${user.id} reviewed FoodItem ${food.id}`);
                } catch (error) {
                    console.error(`  Error creating review for User ${user.id} on FoodItem ${food.id}:`, error.message);
                }
            }
        }
    }
}

async function seedCollections(users, posts, restaurants, foodItems) {
    if (!users || users.length === 0 || ((!posts || posts.length === 0) && (!restaurants || restaurants.length === 0) && (!foodItems || foodItems.length === 0))) {
        console.log('Skipping Collections: No users or items to collect.');
        return;
    }
    console.log('Seeding Collections...');

    // Collect Posts
    if (posts && posts.length > 0) {
        for (const user of users) {
            for (const post of getRandomSubset(posts)) {
                const createData = {
                    itemType: CollectionType.POST,
                    user: { connect: { id: user.id } },
                    post: { connect: { id: post.id } },
                };
                try {
                    await prisma.collectionItem.upsert({
                        where: { unique_user_post_collection: { userId: user.id, postId: post.id } },
                        update: {},
                        create: createData,
                    });
                    console.log(`  User ${user.id} collected Post ${post.id}`);
                } catch (error) {
                    console.error(`  Error creating collection for User ${user.id} on Post ${post.id}:`);
                    console.error(error);
                }
            }
        }
    }

    // Collect Restaurants
    if (restaurants && restaurants.length > 0) {
        for (const user of users) {
            for (const restaurant of getRandomSubset(restaurants)) {
                const createData = {
                    itemType: CollectionType.RESTAURANT,
                    user: { connect: { id: user.id } },
                    restaurant: { connect: { id: restaurant.id } },
                };
                try {
                    await prisma.collectionItem.upsert({
                        where: { unique_user_restaurant_collection: { userId: user.id, restaurantId: restaurant.id } },
                        update: {},
                        create: createData,
                    });
                    console.log(`  User ${user.id} collected Restaurant ${restaurant.id}`);
                } catch (error) {
                    console.error(`  Error creating collection for User ${user.id} on Restaurant ${restaurant.id}:`);
                    console.error(error);
                }
            }
        }
    }

    // Collect Food Items
    if (foodItems && foodItems.length > 0) {
        for (const user of users) {
            for (const food of getRandomSubset(foodItems)) {
                const createData = {
                    itemType: CollectionType.FOOD,
                    user: { connect: { id: user.id } },
                    foodItem: { connect: { id: food.id } },
                };
                try {
                    await prisma.collectionItem.upsert({
                        where: { unique_user_food_collection: { userId: user.id, foodItemId: food.id } },
                        update: {},
                        create: createData,
                    });
                    console.log(`  User ${user.id} collected FoodItem ${food.id}`);
                } catch (error) {
                    console.error(`  Error creating collection for User ${user.id} on FoodItem ${food.id}:`);
                    console.error(error);
                }
            }
        }
    }
}


// --- Main Execution ---
async function main() {
    console.log(`Start seeding process...`);

    // --- 1. Clean Database ---
    console.log('Cleaning database...');
    try {
        // Order matters due to foreign keys
        await prisma.like.deleteMany();
        await prisma.collectionItem.deleteMany();
        await prisma.review.deleteMany();
        await prisma.comment.deleteMany();
        await prisma.userAction.deleteMany();
        await prisma.post.deleteMany();
        await prisma.foodItem.deleteMany(); // FoodItem before Restaurant if related through other tables
        await prisma.restaurant.deleteMany();
        await prisma.user.deleteMany();
        console.log('Database cleaned successfully.');
    } catch (error) {
        console.error('Error cleaning database:', error);
        // process.exit(1); // Uncomment to exit if cleaning fails
    }

    // --- 2. Seed Models ---
    const users = await seedUsers();
    // Ensure users were created before proceeding
    if (!users || users.length === 0) {
        console.error("Fatal: No users were created. Aborting seed.");
        process.exit(1);
    }
    const restaurants = await seedRestaurants();
    const foodItems = await seedFoodItems();
    // Ensure food items were created before seeding dependent data
    // if (!foodItems || foodItems.length === 0) {
    //    console.warn("Warning: No food items were created. Dependent data (reviews, collections) might be skipped or fail.");
    // }

    const posts = await seedPosts(users);
    await seedComments(users, posts);
    await seedLikes(users, posts);
    // Pass only successfully created restaurants/foodItems to dependent seeds
    const validRestaurants = restaurants.filter(r => r && r.id);
    const validFoodItems = foodItems.filter(f => f && f.id);
    const validPosts = posts.filter(p => p && p.id);

    await seedReviews(users, validRestaurants, validFoodItems);
    await seedCollections(users, validPosts, validRestaurants, validFoodItems);


    console.log(`Seeding finished.`);
}

main()
    .catch(async (e) => {
        console.error("Unhandled error in main seeding execution:", e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        console.log("Disconnecting Prisma Client...");
        await prisma.$disconnect();
        console.log("Prisma Client disconnected.");
    });
