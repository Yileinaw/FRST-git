import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import type { UserInfo } from '@/types/api';
import type { CollectionItem, CollectionType } from '@/types/collection'; // Import CollectionType
import { ElMessage } from 'element-plus'; // Import ElMessage for feedback
import api from '@/services/api'; // Import the central API service

const USER_INFO_STORAGE_KEY = 'user_info';
const COLLECTIONS_STORAGE_KEY = 'frs_collections'; // New key for collections

function loadFromStorage<T>(key: string): T | null {
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored) as T;
        } catch (e) {
            console.error(`Error parsing stored data for key ${key}:`, e);
            localStorage.removeItem(key);
        }
    }
    return null;
}

// Define mock collections directly here
const MOCK_COLLECTIONS: CollectionItem[] = [
    {
        id: 1,
        collectedId: 101,
        type: 'post',
        title: '社区帖子：美味的周末早午餐分享',
        imageUrl: 'https://via.placeholder.com/150/FFA07A/000000?text=Post1',
        collectedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        link: '/community/post/101'
    },
    {
        id: 2,
        collectedId: 205,
        type: 'food',
        title: '特色菜品：秘制红烧肉',
        imageUrl: 'https://via.placeholder.com/150/98FB98/000000?text=Food1',
        collectedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        link: '/food/205' // Assuming /food/:id route exists later
    },
    {
        id: 3,
        collectedId: 108,
        type: 'post',
        title: '探店笔记：城中最火的咖啡馆',
        imageUrl: 'https://via.placeholder.com/150/ADD8E6/000000?text=Post2',
        collectedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        link: '/community/post/108'
    },
];

// 模拟用户数据 (根据需要调整)
const mockUser: UserInfo = {
    id: 999,
    username: '模拟用户',
    avatar: '', // 可以留空或指向一个默认头像 URL
};

// Helper to generate next collection ID
let nextCollectionIdCounter = Date.now(); // Simple unique ID generator
const getNextCollectionId = () => nextCollectionIdCounter++;

export const useUserStore = defineStore('user', () => {
    const userInfo = ref<UserInfo | null>(loadFromStorage<UserInfo>(USER_INFO_STORAGE_KEY));
    const collections = ref<CollectionItem[]>([]); // Initialize empty, fetch from API
    const hasFetchedCollections = ref(false);
    const collectionsLoading = ref(false);

    // Watchers for userInfo persistence
    watch(userInfo, (newUserInfo) => {
        if (newUserInfo) {
            localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(newUserInfo));
        } else {
            localStorage.removeItem(USER_INFO_STORAGE_KEY);
        }
    }, { deep: true });

    function setUser(newUserInfo: UserInfo | null) {
        userInfo.value = newUserInfo;
        // When user logs in, reset collection state and fetch them
        if (newUserInfo) {
            collections.value = [];
            hasFetchedCollections.value = false;
            fetchCollections(); // Fetch collections on login
        } else {
            // Clear collections on logout
            collections.value = [];
            hasFetchedCollections.value = false;
            localStorage.removeItem(COLLECTIONS_STORAGE_KEY); // Clear any old cache
        }
    }

    function clearUser() {
        setUser(null);
    }

    async function fetchUserInfo() {
        // Assume login process sets user info via setUser or this fetches it
        // ... existing fetch logic ...
        if (userInfo.value && !hasFetchedCollections.value) {
            await fetchCollections(); // Fetch collections if user is loaded but collections aren't
        }
        return userInfo.value;
    }

    const getUserInfo = (): UserInfo | null => {
        return userInfo.value;
    };

    const getUserId = (): number | undefined => {
        return userInfo.value?.id;
    };

    // --- Add updateAvatar Action ---
    function updateAvatar(newAvatar: string) {
        if (userInfo.value) {
            userInfo.value = { ...userInfo.value, avatar: newAvatar };
        } else {
            console.warn('Cannot update avatar: userInfo is null.');
        }
    }
    // ---------------------------------

    // --- Fetch Collections from API ---
    async function fetchCollections() {
        if (!userInfo.value) { // Only fetch if logged in
            console.log('Cannot fetch collections, user not logged in.');
            collections.value = []; // Ensure collections are empty if not logged in
            hasFetchedCollections.value = true; // Mark as "fetched" (empty)
            return;
        }
        if (collectionsLoading.value) return; // Prevent concurrent fetches

        collectionsLoading.value = true;
        console.log('Fetching collections from API...');
        try {
            // Call GET /api/collections - Now expects nested data
            const response = await api.get<{ data: any[] }>(`/collections`);

            // Map API response (which now includes nested post/food/restaurant) to CollectionItem[] format
            const fetchedCollections: CollectionItem[] = response.data.data.map((item: any) => {
                let title = `未知项目 ID: ${item.id}`;
                let imageUrl = 'https://via.placeholder.com/150/EEEEEE/AAAAAA?text=Item'; // Default image
                let link = '/';
                let collectedId = 0;
                let type = item.itemType.toLowerCase();

                if (item.itemType === 'POST' && item.post) {
                    collectedId = item.post.id;
                    title = item.post.title || `社区帖子 ID: ${collectedId}`;
                    // Use the first image URL if available
                    imageUrl = Array.isArray(item.post.imageUrls) && item.post.imageUrls.length > 0
                        ? item.post.imageUrls[0]
                        : 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=Post';
                    link = `/post/${collectedId}`;
                } else if (item.itemType === 'FOOD' && item.foodItem) {
                    collectedId = item.foodItem.id;
                    title = item.foodItem.name || `美食 ID: ${collectedId}`;
                    imageUrl = item.foodItem.imageUrl || 'https://via.placeholder.com/150/98FB98/000000?text=Food';
                    link = `/food/${collectedId}`; // Update if food detail route changes
                } else if (item.itemType === 'RESTAURANT' && item.restaurant) {
                    collectedId = item.restaurant.id;
                    title = item.restaurant.name || `餐厅 ID: ${collectedId}`;
                    imageUrl = item.restaurant.imageUrl || 'https://via.placeholder.com/150/ADD8E6/000000?text=Restaurant';
                    link = `/restaurant/${collectedId}`; // Update if restaurant detail route changes
                }

                return {
                    id: item.id, // This is the CollectionItem ID
                    collectedId: collectedId, // This is the ID of the Post/Food/Restaurant
                    type: type as CollectionType,
                    title: title,
                    imageUrl: imageUrl,
                    collectedAt: item.createdAt,
                    link: link
                };
            });

            collections.value = fetchedCollections;
            console.log('Fetched collections from API:', collections.value);
            hasFetchedCollections.value = true;

        } catch (error) {
            console.error('Failed to fetch collections from API:', error);
            ElMessage.error('加载收藏列表失败');
            // Keep local state empty or handle error appropriately
            collections.value = [];
            hasFetchedCollections.value = false; // Allow refetch on next try
        } finally {
            collectionsLoading.value = false;
        }
    }

    // --- Add Collection via API ---
    async function addCollection(itemData: { collectedId: number; type: CollectionType; title?: string; imageUrl?: string; link?: string }): Promise<boolean> {
        if (!userInfo.value) {
            ElMessage.warning('请先登录再收藏');
            return false;
        }
        const alreadyExists = collections.value.some(
            item => item.type === itemData.type && item.collectedId === itemData.collectedId
        );
        if (alreadyExists) {
            ElMessage.warning('您已经收藏过该项目了');
            return false;
        }

        console.log('Adding collection via API:', itemData);
        try {
            // Call POST /api/collections
            const response = await api.post<any>(`/collections`, {
                itemId: itemData.collectedId,
                itemType: itemData.type.toUpperCase() // Backend expects uppercase enum
            });

            // On success, refetch collections to get the updated list with the correct ID from backend
            ElMessage.success('收藏成功!');
            await fetchCollections(); // Refetch the entire list
            return true;

        } catch (error: any) {
            console.error('Failed to add collection via API:', error);
            const message = error.response?.data?.message || "收藏失败，请稍后再试";
            if (error.response?.status === 409) { // Already collected conflict
                ElMessage.warning('您已经收藏过该项目了');
                // Optionally refetch to sync state if needed
                await fetchCollections();
            } else {
                ElMessage.error(message);
            }
            return false;
        }
    }

    // --- Remove Collection via API ---
    async function removeCollection(collectionId: number): Promise<boolean> {
        if (!userInfo.value) {
            ElMessage.warning('请先登录');
            return false;
        }

        console.log(`Removing collection via API, ID: ${collectionId}...`);
        // Find the item locally first to get type and itemId needed for DELETE API
        const itemToRemove = collections.value.find(item => item.id === collectionId);
        if (!itemToRemove) {
            console.error('Cannot remove collection: item not found locally.');
            ElMessage.error('取消收藏失败：未找到项目');
            return false;
        }

        try {
            // Call DELETE /api/collections?type=...&itemId=...
            await api.delete(`/collections`, {
                params: {
                    itemType: itemToRemove.type.toUpperCase(),
                    itemId: itemToRemove.collectedId
                }
            });

            // On success, remove locally or refetch
            const index = collections.value.findIndex(item => item.id === collectionId);
            if (index !== -1) {
                collections.value.splice(index, 1);
            }
            ElMessage.success('已取消收藏');
            return true;

        } catch (error: any) {
            console.error('Failed to remove collection via API:', error);
            const message = error.response?.data?.message || "取消收藏失败，请稍后再试";
            ElMessage.error(message);
            return false;
        }
    }
    // ---------------------------------------------

    // isCollected computed remains the same, works on local state which is synced from API
    const isCollected = computed(() => {
        return (type: CollectionType, collectedId: number): boolean => {
            return collections.value.some(item => item.type === type && item.collectedId === collectedId);
        };
    });

    // --- Actions for Settings Page ---
    async function updateUserProfile(profileData: Pick<UserInfo, 'username'>): Promise<boolean> {
        console.log('Simulating update profile:', profileData);
        return new Promise<boolean>((resolve) => {
            setTimeout(() => {
                if (!userInfo.value) {
                    ElMessage.error('更新失败：用户信息不存在');
                    resolve(false);
                    return;
                }
                userInfo.value = { ...userInfo.value, username: profileData.username };
                ElMessage.success('用户名更新成功!');
                resolve(true);
            }, 200); // Simulate 200ms delay
        });
    }

    async function updatePassword(passwordData: { current: string, new: string }): Promise<boolean> {
        console.log('Simulating update password...');
        return new Promise<boolean>((resolve) => {
            setTimeout(() => {
                // Simple mock check
                if (passwordData.current !== 'password123') { // Assuming 'password123' is the mock current password
                    ElMessage.error('当前密码不正确');
                    resolve(false);
                } else if (passwordData.new.length < 6) {
                    ElMessage.error('新密码长度至少需要6位');
                    resolve(false);
                } else {
                    ElMessage.success('密码修改成功!');
                    resolve(true);
                }
            }, 250); // Simulate 250ms delay
        });
    }
    // ---------------------------------

    return {
        userInfo,
        collections,
        collectionsLoading,
        hasFetchedCollections,
        setUser,
        clearUser,
        fetchUserInfo,
        getUserInfo,
        getUserId,
        updateAvatar,
        fetchCollections,
        addCollection,
        removeCollection,
        isCollected,
        updateUserProfile,
        updatePassword,
    };
});
